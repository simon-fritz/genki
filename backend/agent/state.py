from typing import TypedDict, Annotated, List, Dict, Any
import operator
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    # The conversation history (standard for ReAct)
    messages: Annotated[List[BaseMessage], operator.add]
    
    # Inputs
    front: str
    deck_id: str
    user_id: int

    # Context (Injected by ContextBuilder)
    user_preferences: str  # e.g., "Likes simple analogies"
    deck_context: str      # e.g., "Biology 101 - Cell Division"
    
    # Internal Logic
    is_safe: bool
    safety_reason: str
    draft_answer: str      # The raw answer from the generator
    critique_count: int    # To prevent infinite reflection loops
    
    # Final Output
    final_json: Dict[str, Any]