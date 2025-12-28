"""
Tests for the AgentState TypedDict.
"""
import pytest
from langchain_core.messages import HumanMessage, AIMessage
from agent.state import AgentState


class TestAgentState:
    """Test suite for AgentState structure."""

    def test_state_creation(self):
        """AgentState can be created with required fields."""
        state: AgentState = {
            "messages": [HumanMessage(content="Test")],
            "front": "What is Python?",
            "deck_id": 1,
            "user_id": 1,
            "user_preferences": {},
            "user_weights": {},
            "deck_context": "Test Deck",
            "style_instructions": "",
            "features_used": [],
            "is_safe": True,
            "safety_reason": "",
            "draft_answer": "",
            "critique_count": 0,
            "generation_meta": {},
            "final_json": {},
        }
        assert state["front"] == "What is Python?"
        assert len(state["messages"]) == 1

    def test_messages_accumulation(self):
        """Messages should accumulate via operator.add."""
        import operator
        
        messages1 = [HumanMessage(content="Question")]
        messages2 = [AIMessage(content="Answer")]
        
        # The Annotated type uses operator.add for merging
        result = operator.add(messages1, messages2)
        assert len(result) == 2
        assert result[0].content == "Question"
        assert result[1].content == "Answer"

    def test_state_has_all_required_fields(self):
        """AgentState should have all documented fields."""
        required_fields = [
            "messages", "front", "deck_id", "user_id",
            "user_preferences", "user_weights", "deck_context",
            "style_instructions", "features_used", "is_safe",
            "safety_reason", "draft_answer", "critique_count",
            "generation_meta", "final_json"
        ]
        
        # Check annotations exist
        for field in required_fields:
            assert field in AgentState.__annotations__, f"Missing field: {field}"
