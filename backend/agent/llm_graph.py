import json
import logging
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
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    temperature=0.3,
    google_api_key=settings.GEMINI_API_KEY,
    convert_system_message_to_human=True
)

# Bind tools to the LLM for the ReAct Agent
tools = [search_deck_documents, web_search_tool]
llm_with_tools = llm.bind_tools(tools)


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
    prompt = ChatPromptTemplate.from_messages([
        ("system",
         "You are a content safety filter. Check if the text is safe. Return JSON: {{'allowed': bool, 'reason': str}}"),
        ("human", "{text}")
    ])
    chain = prompt | llm | JsonOutputParser()
    result = chain.invoke({"text": state["front"]})

    return {
        "is_safe": result.get("allowed", False),
        "safety_reason": result.get("reason", "Unknown")
    }


def agent_node(state: AgentState):
    """
    The ReAct Brain. Decides whether to use tools or answer.
    """
    system_msg = (
        f"You are a study assistant generating the BACK side of an Anki card.\n"
        f"Deck: '{state['deck_context']}' (deck_id={state['deck_id']}).\n\n"
        f"Personalization instructions:\n{state['style_instructions']}\n\n"
        "IMPORTANT RULES:\n"
        "1. You MUST prioritize information found in the 'search_deck_documents' tool over your own internal knowledge.\n"
        "2. ALWAYS check the deck documents first, even for simple terms, to ensure the definition matches the user's specific course material.\n"
        "3. Only use your internal knowledge if the tools return no results.\n"
        "4. If you use the tool, cite the source context implicitly in your answer."
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
            res = web_search_tool.invoke(tool_args)
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
    # Extract the final answer from the ReAct conversation
    last_message = state["messages"][-1]
    draft_text = getattr(last_message, "content", "") or ""
    return {"draft_answer": draft_text}


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
            "messages": [HumanMessage(content=f"Refine the answer. Feedback: {feedback}")]
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


# --- Build the Graph ---

workflow = StateGraph(AgentState)

workflow.add_node("context_builder", context_builder_node)
workflow.add_node("guardrail", guardrail_node)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tool_node)
workflow.add_node("generator", generator_node)
workflow.add_node("critic", critic_node)
workflow.add_node("formatter", formatter_node)

# Flow
workflow.set_entry_point("context_builder")
workflow.add_edge("context_builder", "guardrail")
workflow.add_conditional_edges("guardrail", route_guardrail, {
    "agent": "agent",
    "end_unsafe": END
})

workflow.add_conditional_edges("agent", route_agent, {
    "tools": "tools",
    "generator": "generator"
})
workflow.add_edge("tools", "agent")

workflow.add_edge("generator", "critic")
workflow.add_conditional_edges("critic", route_critic, {
    "agent": "agent",
    "formatter": "formatter"
})
workflow.add_edge("formatter", END)

# Compile
app = workflow.compile()
