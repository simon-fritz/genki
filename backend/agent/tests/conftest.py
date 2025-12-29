"""
Pytest fixtures for agent tests.
"""

import os
import pytest
from unittest.mock import MagicMock, patch
from django.contrib.auth.models import User
from rest_framework.test import APIClient

from cards.models import Deck
from accounts.models import UserProfile


@pytest.fixture
def test_user(db):
    """Create a test user."""
    user = User.objects.create_user(
        username="testuser", email="test@example.com", password="testpass123"
    )
    return user


@pytest.fixture
def test_user_with_profile(test_user):
    """Create a test user with a profile."""
    profile, _ = UserProfile.objects.get_or_create(user=test_user)
    profile.preferences = {
        "verbosity": "balanced",
        "structure": "sections",
        "language": "en",
        "include_examples": True,
    }
    profile.weights = {
        "examples": 0.7,
        "analogies": 0.3,
    }
    profile.save()
    return test_user


@pytest.fixture
def test_deck(test_user):
    """Create a test deck."""
    return Deck.objects.create(user=test_user, name="Biology 101 - Cell Division")


@pytest.fixture
def authenticated_client(test_user):
    """Return an authenticated API client."""
    client = APIClient()
    client.force_authenticate(user=test_user)
    return client


@pytest.fixture
def mock_llm():
    """Mock the LLM to avoid real API calls."""
    with patch("agent.llm_graph.llm") as mock:
        mock_response = MagicMock()
        mock_response.content = "Mocked LLM response"
        mock.invoke.return_value = mock_response
        yield mock


@pytest.fixture
def mock_llm_with_tools():
    """Mock the LLM with tools bound."""
    with patch("agent.llm_graph.llm_with_tools") as mock:
        mock_response = MagicMock()
        mock_response.content = "This is a detailed answer about the topic."
        mock_response.tool_calls = None
        mock.invoke.return_value = mock_response
        yield mock


@pytest.fixture
def mock_vector_store():
    """Mock the Supabase vector store."""
    with patch("agent.tools.SupabaseVectorStore") as mock_vs:
        mock_doc = MagicMock()
        mock_doc.page_content = (
            "This is content from the deck documents about cell division."
        )
        mock_vs.return_value.similarity_search.return_value = [mock_doc]
        yield mock_vs


@pytest.fixture
def mock_tavily():
    """Mock the Tavily search tool."""
    with patch("agent.tools.web_search_tool") as mock:
        mock.invoke.return_value = "Web search results about the topic."
        yield mock


@pytest.fixture
def sample_agent_state():
    """Return a sample initial agent state."""
    from langchain_core.messages import HumanMessage

    return {
        "messages": [HumanMessage(content="What is mitosis?")],
        "front": "What is mitosis?",
        "deck_id": 1,
        "user_id": 1,
        "critique_count": 0,
        "is_safe": True,
        "safety_reason": "",
        "draft_answer": "",
        "user_preferences": {},
        "user_weights": {},
        "deck_context": "",
        "style_instructions": "",
        "features_used": [],
        "generation_meta": {},
        "final_json": {},
    }


# Environment check fixtures
@pytest.fixture
def has_gemini_key():
    """Check if Gemini API key is available."""
    return bool(os.getenv("GEMINI_API_KEY"))


@pytest.fixture
def has_tavily_key():
    """Check if Tavily API key is available."""
    return bool(os.getenv("TAVILY_API_KEY"))


@pytest.fixture
def has_supabase_config():
    """Check if Supabase is configured."""
    return bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_KEY"))
