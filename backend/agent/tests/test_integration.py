"""
Integration tests for the agent - these test real API calls.

IMPORTANT: These tests require valid API keys and will make real API calls.
They are marked with pytest markers to allow skipping in CI.

Run with: pytest agent/tests/test_integration.py -v -m integration
"""

import os
import time
import pytest
from unittest.mock import patch, MagicMock
from langchain_core.messages import HumanMessage

from agent.state import AgentState


# Skip integration tests if API keys not available
pytestmark = pytest.mark.integration


def has_api_keys():
    """Check if all required API keys are present."""
    return bool(os.getenv("GEMINI_API_KEY") and os.getenv("TAVILY_API_KEY"))


def has_supabase():
    """Check if Supabase is configured."""
    return bool(os.getenv("SUPABASE_URL") and os.getenv("SUPABASE_KEY"))


@pytest.mark.skipif(not has_api_keys(), reason="API keys not configured")
class TestGeminiAPIIntegration:
    """Tests for real Gemini API calls."""

    def test_llm_responds_to_simple_query(self):
        """LLM should respond to a simple query."""
        from agent.llm_graph import llm

        response = llm.invoke("What is 2+2? Reply with just the number.")

        assert response is not None
        assert hasattr(response, "content")
        assert "4" in response.content

    def test_llm_with_tools_can_invoke(self):
        """LLM with tools should be invocable."""
        from agent.llm_graph import llm_with_tools
        from langchain_core.messages import SystemMessage, HumanMessage

        messages = [
            SystemMessage(content="You are a helpful assistant."),
            HumanMessage(content="What is the capital of France?"),
        ]

        response = llm_with_tools.invoke(messages)

        assert response is not None
        assert hasattr(response, "content")
        # Should either answer directly or request a tool
        assert response.content or response.tool_calls

    def test_guardrail_allows_safe_content(self):
        """Guardrail should allow safe educational content."""
        from agent.llm_graph import guardrail_node

        state = {
            "front": "What is photosynthesis?",
            "messages": [],
        }

        result = guardrail_node(state)

        assert result["is_safe"] == True

    @pytest.mark.slow
    @pytest.mark.django_db
    def test_full_agent_pipeline_without_rag(self):
        """Full agent should generate a flashcard answer."""
        from agent.llm_graph import app
        from cards.models import Deck
        from django.contrib.auth.models import User

        # Create test data
        user = User.objects.create_user(username="integration_test", password="test")
        deck = Deck.objects.create(user=user, name="Integration Test Deck")

        initial_state: AgentState = {
            "messages": [HumanMessage(content="What is DNA?")],
            "front": "What is DNA?",
            "deck_id": deck.id,
            "user_id": user.id,
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

        start_time = time.time()
        final_state = app.invoke(initial_state)
        elapsed = time.time() - start_time

        assert final_state["is_safe"] == True
        assert "final_json" in final_state
        assert final_state["final_json"]["back"]  # Should have content
        assert elapsed < 60  # Should complete within 60 seconds

        # Cleanup
        deck.delete()
        user.delete()


@pytest.mark.skipif(not has_api_keys(), reason="Tavily API key not configured")
class TestTavilyAPIIntegration:
    """Tests for real Tavily API calls."""

    def test_tavily_search_returns_results(self):
        """Tavily should return search results."""
        from agent.tools import web_search_tool

        result = web_search_tool.invoke({"query": "what is machine learning"})

        assert result is not None
        # Tavily returns a list of results or string representation
        assert len(str(result)) > 0


@pytest.mark.skipif(not has_supabase(), reason="Supabase not configured")
class TestRAGIntegration:
    """Tests for RAG pipeline with Supabase."""

    def test_vector_store_connection(self):
        """Should connect to Supabase vector store."""
        from agent.tools import _build_supabase_client, _build_embedding_model

        client = _build_supabase_client()
        embeddings = _build_embedding_model()

        assert client is not None
        assert embeddings is not None

    def test_embedding_model_generates_vectors(self):
        """Embedding model should generate vectors."""
        from uploads.services.document_ingestion import _build_embedding_model

        embeddings = _build_embedding_model()
        vector = embeddings.embed_query("test query")

        assert vector is not None
        assert len(vector) > 0  # Should have embedding dimensions

    @pytest.mark.django_db
    def test_search_deck_documents_empty_deck(self):
        """Search should return empty for deck with no documents."""
        from agent.tools import search_deck_documents
        from cards.models import Deck
        from django.contrib.auth.models import User

        user = User.objects.create_user(username="rag_test", password="test")
        deck = Deck.objects.create(user=user, name="Empty Deck")

        result = search_deck_documents.invoke(
            {"query": "test query", "deck_id": deck.id}
        )

        # Empty result expected
        assert result == "" or result is None or len(result) == 0

        # Cleanup
        deck.delete()
        user.delete()


class TestPerformanceBenchmarks:
    """Performance tests for the agent pipeline."""

    @pytest.mark.skipif(not has_api_keys(), reason="API keys not configured")
    @pytest.mark.slow
    def test_agent_response_time(self):
        """Agent should respond within acceptable time."""
        from agent.llm_graph import llm

        times = []
        for _ in range(3):
            start = time.time()
            llm.invoke("Define: variable")
            elapsed = time.time() - start
            times.append(elapsed)

        avg_time = sum(times) / len(times)

        # Log for analysis
        print(f"\nAverage LLM response time: {avg_time:.2f}s")
        print(f"Min: {min(times):.2f}s, Max: {max(times):.2f}s")

        assert avg_time < 10  # Should average under 10 seconds

    def test_prompting_performance(self):
        """Prompt building should be fast."""
        from agent.prompting import build_style_instructions

        prefs = {
            "verbosity": "detailed",
            "structure": "sections",
            "include_examples": True,
        }
        weights = {"examples": 0.8, "analogies": 0.6}

        start = time.time()
        for _ in range(1000):
            build_style_instructions(prefs, weights)
        elapsed = time.time() - start

        print(f"\n1000 prompt builds: {elapsed:.4f}s")
        assert elapsed < 1  # Should complete 1000 builds in under 1 second
