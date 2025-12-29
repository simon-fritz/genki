"""
Tests for the agent tools.
"""

import pytest
from unittest.mock import patch, MagicMock

# Import the class so we can patch it specifically
from langchain_community.tools.tavily_search import TavilySearchResults
from agent.tools import search_deck_documents, web_search_tool


class TestSearchDeckDocuments:
    """Test suite for search_deck_documents tool."""

    @patch("agent.tools._build_supabase_client")
    @patch("agent.tools._build_embedding_model")
    @patch("agent.tools.SupabaseVectorStore")
    def test_returns_empty_string_on_no_results(self, mock_vs, mock_embed, mock_client):
        """Should return empty string when no documents found."""
        mock_client.return_value = MagicMock()
        mock_embed.return_value = MagicMock()
        mock_vs.return_value.similarity_search.return_value = []

        result = search_deck_documents.invoke({"query": "test query", "deck_id": 1})
        assert result == ""

    @patch("agent.tools._build_supabase_client")
    @patch("agent.tools._build_embedding_model")
    @patch("agent.tools.SupabaseVectorStore")
    def test_returns_concatenated_content(self, mock_vs, mock_embed, mock_client):
        """Should return concatenated page content from results."""
        mock_client.return_value = MagicMock()
        mock_embed.return_value = MagicMock()

        mock_doc1 = MagicMock()
        mock_doc1.page_content = "First chunk of content"
        mock_doc2 = MagicMock()
        mock_doc2.page_content = "Second chunk of content"

        mock_vs.return_value.similarity_search.return_value = [mock_doc1, mock_doc2]

        result = search_deck_documents.invoke({"query": "test query", "deck_id": 1})
        assert "First chunk of content" in result
        assert "Second chunk of content" in result
        assert "\n\n" in result

    @patch("agent.tools._build_supabase_client")
    @patch("agent.tools._build_embedding_model")
    @patch("agent.tools.SupabaseVectorStore")
    def test_filters_by_deck_id(self, mock_vs, mock_embed, mock_client):
        """Should filter search by deck_id."""
        mock_client.return_value = MagicMock()
        mock_embed.return_value = MagicMock()
        mock_vs.return_value.similarity_search.return_value = []

        search_deck_documents.invoke({"query": "test", "deck_id": 42})

        mock_vs.return_value.similarity_search.assert_called_once()
        call_args = mock_vs.return_value.similarity_search.call_args
        assert call_args.kwargs.get("filter") == {"deck_id": 42}

    @patch("agent.tools._build_supabase_client")
    @patch("agent.tools._build_embedding_model")
    @patch("agent.tools.SupabaseVectorStore")
    def test_requests_four_results(self, mock_vs, mock_embed, mock_client):
        """Should request k=4 results from similarity search."""
        mock_client.return_value = MagicMock()
        mock_embed.return_value = MagicMock()
        mock_vs.return_value.similarity_search.return_value = []

        search_deck_documents.invoke({"query": "test", "deck_id": 1})

        call_args = mock_vs.return_value.similarity_search.call_args
        assert call_args.kwargs.get("k") == 4


class TestWebSearchTool:
    """Test suite for web_search_tool (Tavily)."""

    def test_tool_exists(self):
        """Web search tool should be properly configured."""
        assert web_search_tool is not None
        assert hasattr(web_search_tool, "invoke")

    # FIX APPLIED HERE: Patch the Class method, not the instance object
    @patch("langchain_community.tools.tavily_search.TavilySearchResults.invoke")
    def test_invoke_returns_results(self, mock_invoke):
        """Invoke should return search results."""
        mock_invoke.return_value = [
            {"title": "Result 1", "content": "Content 1"},
            {"title": "Result 2", "content": "Content 2"},
        ]

        result = web_search_tool.invoke({"query": "what is mitosis"})
        assert len(result) == 2
