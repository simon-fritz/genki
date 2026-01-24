import json
import logging
import re
from typing import Literal

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.output_parsers import JsonOutputParser
from langgraph.graph import StateGraph, END

from accounts.models import UserProfile
from cards.models import Deck
from django.conf import settings
from .state import AgentState
from .tools import search_deck_documents, web_search_tool
from .prompting import build_style_instructions

logger = logging.getLogger(__name__)

# --- Setup LLM ---
tools = [search_deck_documents, web_search_tool]

if getattr(settings, "GEMINI_API_KEY", ""):
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.3,
        google_api_key=settings.GEMINI_API_KEY,
        convert_system_message_to_human=True,
    )
    llm_with_tools = llm.bind_tools(tools)
else:
    # CI / tests without keys: provide stubs (tests patch these anyway)
    from unittest.mock import MagicMock

    llm = MagicMock(name="llm")
    llm.invoke.side_effect = RuntimeError("GEMINI_API_KEY not configured")

    llm_with_tools = MagicMock(name="llm_with_tools")
    llm_with_tools.invoke.side_effect = RuntimeError("GEMINI_API_KEY not configured")


# --- Nodes ---


def context_builder_node(state: AgentState):
    user_prefs = {}
    user_weights = {}
    deck_ctx = "Unknown deck"

    if state["user_id"]:
        profile, _ = UserProfile.objects.get_or_create(user_id=state["user_id"])
        user_prefs = profile.preferences or {}
        user_weights = profile.weights or {}

    deck = Deck.objects.filter(id=state["deck_id"]).only("name").first()
    if deck:
        deck_ctx = deck.name

    style, features_used = build_style_instructions(user_prefs, user_weights)

    return {
        "user_preferences": user_prefs,
        "user_weights": user_weights,
        "deck_context": deck_ctx,
        "style_instructions": style,
        "features_used": features_used,
        "critique_count": 0,
        "generation_meta": {
            "prompt_version": "v1",
            "features_used": features_used,
            "rag_used": False,
            "sources": [],
        },
    }


def guardrail_node(state: AgentState):
    """
    Checks for safety.
    """
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a content safety filter. Analyze the user text for harmful content "
                "(hate speech, violence, sexual content, illegal activities, etc.).\n\n"
                "IMPORTANT: Respond with ONLY a valid JSON object, no other text.\n"
                "Format: {{\"allowed\": true, \"reason\": \"No safety violations detected.\"}}\n"
                "Or: {{\"allowed\": false, \"reason\": \"Brief explanation of violation\"}}\n\n"
                "Do NOT include any explanation, preamble, or markdown. ONLY the JSON object.",
            ),
            ("human", "{text}"),
        ]
    )
    
    try:
        chain = prompt | llm | JsonOutputParser()
        result = chain.invoke({"text": state["front"]})
        return {
            "is_safe": result.get("allowed", False),
            "safety_reason": result.get("reason", "Unknown"),
        }
    except Exception as e:
        # If parsing fails, log the error and default to allowing the content
        # (fail-open for usability, but log for monitoring)
        logger.warning(f"Guardrail parsing failed, defaulting to allowed: {e}")
        return {
            "is_safe": True,
            "safety_reason": "Guardrail check skipped due to parsing error",
        }


def agent_node(state: AgentState):
    """
    The ReAct Brain. Decides whether to use tools or answer.
    """
    system_msg = (
        f"You are a study assistant generating the BACK side of an Anki flashcard.\n"
        f"Deck: '{state['deck_context']}'.\n\n"
        f"Personalization instructions:\n{state['style_instructions']}\n\n"
        "OUTPUT FORMAT:\n"
        "- You may 'think' using reasoning text, but when you are ready to answer, you MUST start the final content with 'FINAL ANSWER:'.\n"
        "- Everything after 'FINAL ANSWER:' will be shown to the user. Everything before it will be hidden.\n"
        "- Keep it concise (ideally under 150 words) unless the user's style asks for detail.\n"
        "- Use bullet points or short paragraphs as appropriate.\n"
        "- Do NOT include phrases like 'Based on the documents...' or 'I will use my internal knowledge...'.\n\n"
        "INFORMATION PRIORITY:\n"
        "1. Try 'search_deck_documents' tool first to find course-specific definitions.\n"
        "2. The user's input may be abbreviated, informal, or use different terminology than the documents.\n"
        "   - If initial search returns nothing, try rephrasing or expanding the query. \n"
        "3. If tools return no results after trying variations, USE YOUR OWN KNOWLEDGE to answer. You MUST still provide a helpful answer.\n"
        "4. Never fail to produce a FINAL ANSWER. Even for ambiguous or short queries, do your best to provide a useful flashcard back.\n"
        "5. Blend tool results naturally into your answer without citing them explicitly."
    )

    messages = [SystemMessage(content=system_msg)] + state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


def tool_node(state: AgentState):
    """
    Executes tools if the Agent requested them.
    """
    last_message = state["messages"][-1]
    tool_calls = getattr(last_message, "tool_calls", None) or []
    results = []
    new_meta = dict(state.get("generation_meta", {}))
    rag_was_used = False

    for tool_call in tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call.get("args", {}) or {}

        # Security: Inject deck_id if the LLM forgot it, or validate it
        if tool_name == "search_deck_documents":
            tool_args["deck_id"] = int(state["deck_id"])
            res = search_deck_documents.invoke(tool_args)
            # Mark RAG usage if we got content
            if res:
                rag_was_used = True
        elif tool_name == "web_search_tool":
            query = tool_args.get("query", "") if isinstance(tool_args, dict) else str(tool_args)
            res = web_search_tool.invoke({"query": query})
        else:
            res = "Tool not found."

        if rag_was_used:
            new_meta["rag_used"] = True

        results.append(
            ToolMessage(
                tool_call_id=tool_call["id"],
                content=str(res),
            )
        )

    return {"messages": results, "generation_meta": new_meta}


def generator_node(state: AgentState):
    """
    Takes the context gathered and drafts the flashcard answer.
    """
    last_message = state["messages"][-1]
    raw_content = getattr(last_message, "content", "") or ""
    
    clean_text = raw_content

    # 1. Primary Method: Strict Tag Splitting
    if "FINAL ANSWER:" in raw_content:
        clean_text = raw_content.split("FINAL ANSWER:", 1)[1].strip()
    
    # 2. Fallback Method: Regex Pattern Matching to remove common conversational starters
    else:
        patterns = [
            r"^(Okay|Sure|certainly|Great|Understood).*?[:\n]",
            r"^Here is (the|an) .*?[:\n]",
            r"^Based on (the|my) .*?[:,\n]",
            r"^I (will|have) .*?[:\n]",
            r"^The answer is[:\s]",
        ]
        
        for pattern in patterns:
            clean_text = re.sub(pattern, "", clean_text, flags=re.IGNORECASE | re.MULTILINE).strip()

    # 3. Final fallback: if clean_text is empty after processing, use the raw content
    # This handles edge cases where the LLM response doesn't follow the expected format
    if not clean_text.strip() and raw_content.strip():
        clean_text = raw_content.strip()
        logger.warning(
            "Generator fallback: using raw content as draft_answer (no FINAL ANSWER found). "
            f"Front: {state.get('front', 'N/A')[:50]}"
        )

    return {"draft_answer": clean_text}


def critic_node(state: AgentState):
    """
    Reflection Step: Critiques the draft against user preferences and question.
    """
    prompt = (
        f"You are a teacher grading a flashcard answer.\n"
        f"1. The User asked: '{state['front']}'\n"
        f"2. The Agent answered: '{state['draft_answer']}'\n"
        f"3. User's learning style: '{state['user_preferences']}'\n\n"
        "Task: Does the answer correctly address the question AND match the learning style? "
        "If yes, return 'PERFECT'. Otherwise explain what to improve."
    )
    response = llm.invoke(prompt)
    feedback = response.content.strip()

    if "PERFECT" in feedback:
        return {"critique_count": state["critique_count"] + 1}  # No change to messages
    else:
        # Inject feedback back into conversation so Agent can fix it
        return {
            "critique_count": state["critique_count"] + 1,
            "messages": [
                HumanMessage(content=f"Refine the answer. Feedback: {feedback}")
            ],
        }


def formatter_node(state: AgentState):
    """
    Deterministic JSON: the UI expects strict JSON, don't rely on the LLM for formatting.
    """
    tags = []
    return {
        "final_json": {
            "front": state["front"],
            "back": state["draft_answer"],
            "tags": tags,
            "generation_meta": state["generation_meta"],
        }
    }


def output_guardrail_node(state: AgentState):
    """
    Output validation guardrail. Checks:
    1. JSON structure validity
    2. Non-empty meaningful content
    3. No placeholder/debug text leakage
    4. Reasonable length bounds
    5. No PII patterns
    """
    issues = []
    final_json = state.get("final_json", {})
    
    # 1. Validate required JSON fields exist
    required_fields = ["front", "back", "tags", "generation_meta"]
    missing_fields = [f for f in required_fields if f not in final_json]
    if missing_fields:
        issues.append(f"Missing required fields: {missing_fields}")
    
    back_content = final_json.get("back", "")
    
    # 2. Check for empty or minimal content
    if not back_content or len(back_content.strip()) < 10:
        issues.append("Answer content is too short or empty")
    
    # 3. Check for placeholder/debug text leakage
    placeholder_patterns = [
        "TODO", "FIXME", "XXX",
        "<placeholder>", "[INSERT", "{{{", "}}}",
        "FINAL ANSWER:",  # Should have been stripped
        "Tool not found",
        "Error:", "Exception:",
    ]
    for pattern in placeholder_patterns:
        if pattern.lower() in back_content.lower():
            issues.append(f"Detected placeholder/debug text: '{pattern}'")
            break
    
    # 4. Check length bounds (too long may indicate runaway generation)
    MAX_ANSWER_LENGTH = 5000  # characters
    if len(back_content) > MAX_ANSWER_LENGTH:
        issues.append(f"Answer exceeds maximum length ({len(back_content)} > {MAX_ANSWER_LENGTH})")
    
    # 5. Basic PII detection (simple patterns)
    import re
    pii_patterns = [
        (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', 'email'),
        (r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', 'phone number'),
        (r'\b\d{3}[-]?\d{2}[-]?\d{4}\b', 'SSN-like pattern'),
        (r'\b\d{16}\b', 'credit card-like number'),
    ]
    for pattern, pii_type in pii_patterns:
        if re.search(pattern, back_content):
            issues.append(f"Potential PII detected: {pii_type}")
            break
    
    # 6. Validate generation_meta structure
    gen_meta = final_json.get("generation_meta", {})
    if not isinstance(gen_meta, dict):
        issues.append("generation_meta is not a valid dictionary")
    
    if issues:
        logger.warning(f"Output guardrail issues: {issues}")
        return {
            "output_passed": False,
            "output_guardrail_reason": "; ".join(issues),
        }
    
    return {
        "output_passed": True,
        "output_guardrail_reason": "All output validation checks passed",
    }


# --- Conditional Edges ---


def route_guardrail(state: AgentState) -> Literal["agent", "end_unsafe"]:
    return "agent" if state["is_safe"] else "end_unsafe"


def route_agent(state: AgentState) -> Literal["tools", "generator"]:
    last_msg = state["messages"][-1]
    if getattr(last_msg, "tool_calls", None):
        return "tools"
    return "generator"


def route_critic(state: AgentState) -> Literal["agent", "formatter"]:
    # Check if critique loop maxed out (avoid infinite loops)
    if state["critique_count"] > 1:
        return "formatter"

    # Check the last message. If it was a HumanMessage (feedback), go back to Agent.
    last_msg = state["messages"][-1]
    if isinstance(last_msg, HumanMessage) and "Feedback:" in last_msg.content:
        return "agent"

    return "formatter"


def route_output_guardrail(state: AgentState) -> Literal["end_success", "end_failed"]:
    """Route based on output guardrail validation results."""
    return "end_success" if state.get("output_passed", False) else "end_failed"


# --- Build the Graph ---

workflow = StateGraph(AgentState)

workflow.add_node("context_builder", context_builder_node)
workflow.add_node("guardrail", guardrail_node)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)
workflow.add_node("generator", generator_node)
workflow.add_node("critic", critic_node)
workflow.add_node("formatter", formatter_node)
workflow.add_node("output_guardrail", output_guardrail_node)

# Flow
workflow.set_entry_point("context_builder")
workflow.add_edge("context_builder", "guardrail")
workflow.add_conditional_edges(
    "guardrail", route_guardrail, {"agent": "agent", "end_unsafe": END}
)

workflow.add_conditional_edges(
    "agent", route_agent, {"tools": "tools", "generator": "generator"}
)
workflow.add_edge("tools", "agent")

workflow.add_edge("generator", "critic")
workflow.add_conditional_edges(
    "critic", route_critic, {"agent": "agent", "formatter": "formatter"}
)
workflow.add_edge("formatter", "output_guardrail")
workflow.add_conditional_edges(
    "output_guardrail", route_output_guardrail, {"end_success": END, "end_failed": END}
)

# Compile
app = workflow.compile()
