import json
import logging
from typing import Literal

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.output_parsers import JsonOutputParser
from langgraph.graph import StateGraph, END

from django.conf import settings
from .state import AgentState
from .tools import search_deck_documents, web_search_tool

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
    """
    Simulates fetching user settings from Postgres.
    """
    # TODO: Replace with: UserProfile.objects.get(id=state['user_id'])
    user_prefs = "I prefer answers that use coding analogies. I am a visual learner." 
    deck_ctx = "Computer Science - Data Structures"
    
    return {
        "user_preferences": user_prefs,
        "deck_context": deck_ctx,
        "critique_count": 0 # Initialize counter
    }

def guardrail_node(state: AgentState):
    """
    Checks for safety. 
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a content safety filter. Check if the text is safe. Return JSON: {{'allowed': bool, 'reason': str}}"),
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
    # We construct a dynamic system prompt based on the Context Node
    system_msg = (
        f"You are a helpful tutor. Context: {state['deck_context']}. "
        f"User Preferences: {state['user_preferences']}. "
        f"Current Deck ID for RAG: {state['deck_id']}."
    )
    
    messages = [SystemMessage(content=system_msg)] + state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

def tool_node(state: AgentState):
    """
    Executes tools if the Agent requested them.
    """
    last_message = state["messages"][-1]
    tool_calls = last_message.tool_calls
    results = []
    
    for tool_call in tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        
        # Security: Inject deck_id if the LLM forgot it, or validate it
        if tool_name == "search_deck_documents" and "deck_id" not in tool_args:
             tool_args["deck_id"] = state["deck_id"]

        if tool_name == "search_deck_documents":
            res = search_deck_documents.invoke(tool_args)
        elif tool_name == "web_search_tool":
            res = web_search_tool.invoke(tool_args)
        else:
            res = "Tool not found."
            
        results.append(
            {"role": "tool", "tool_call_id": tool_call["id"], "name": tool_name, "content": str(res)}
        )
        
    return {"messages": results}

def generator_node(state: AgentState):
    """
    Takes the context gathered and drafts the flashcard answer.
    """
    # Extract the final answer from the ReAct conversation
    last_message = state["messages"][-1]
    draft_text = last_message.content
    return {"draft_answer": draft_text}

def critic_node(state: AgentState):
    """
    Reflection Step: Critiques the draft against user preferences and question.
    """
    prompt = (
        f"You are a teacher grading a flashcard.\n"
        f"1. The User asked: '{state['front']}'\n"
        f"2. The Agent answered: '{state['draft_answer']}'\n"
        f"3. User's learning style: '{state['user_preferences']}'\n\n"
        "Task: Does the answer correctly address the question AND match the learning style? "
        "If yes, return 'PERFECT'. If no, explain why."
    )
    response = llm.invoke(prompt)
    feedback = response.content.strip()
    
    if "PERFECT" in feedback:
        return {"critique_count": state["critique_count"] + 1} # No change to messages
    else:
        # Inject feedback back into conversation so Agent can fix it
        return {
            "critique_count": state["critique_count"] + 1,
            "messages": [HumanMessage(content=f"Refine the answer. Feedback: {feedback}")]
        }

def formatter_node(state: AgentState):
    """
    Ensures final output is strict JSON for the frontend.
    """
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Format the text into JSON: {{'front': str, 'back': str, 'tags': [str]}}."),
        ("human", "Front: {front}\nBack: {draft}")
    ])
    chain = prompt | llm | JsonOutputParser()
    result = chain.invoke({"front": state["front"], "draft": state["draft_answer"]})
    return {"final_json": result}

# --- Conditional Edges ---

def route_guardrail(state: AgentState) -> Literal["agent", "end_unsafe"]:
    if state["is_safe"]:
        return "agent"
    return "end_unsafe"

def route_agent(state: AgentState) -> Literal["tools", "generator"]:
    last_msg = state["messages"][-1]
    if last_msg.tool_calls:
        return "tools"
    return "generator"

def route_critic(state: AgentState) -> Literal["agent", "formatter"]:
    # Check if critique loop maxed out (avoid infinite loops)
    if state["critique_count"] > 3: 
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