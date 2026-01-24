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
    def test_returns_empty_string_on_no_results(self, mock_embed, mock_client):
        """Should return empty string when no documents found."""
        mock_client.return_value = MagicMock()
        mock_embed.return_value = MagicMock()
        mock_embed.return_value.embed_query.return_value = [0.1, 0.2]
        mock_client.return_value.rpc.return_value.execute.return_value = MagicMock(data=[])

        result = search_deck_documents.invoke({"query": "test query", "deck_id": 1})
        assert result == "[No matching documents found]"

    @patch("agent.tools._build_supabase_client")
    @patch("agent.tools._build_embedding_model")
    def test_returns_concatenated_content(self, mock_embed, mock_client):
        """Should return concatenated page content from results."""
        mock_client.return_value = MagicMock()
        mock_embed.return_value.embed_query.return_value = [0.1, 0.2]
        mock_client.return_value.rpc.return_value.execute.return_value = MagicMock(
            data=[
                {"content": "First chunk of content"},
                {"content": "Second chunk of content"},
            ]
        )

        result = search_deck_documents.invoke({"query": "test query", "deck_id": 1})
        assert "First chunk of content" in result
        assert "Second chunk of content" in result
        assert "\n\n" in result

    @patch("agent.tools._build_supabase_client")
    @patch("agent.tools._build_embedding_model")
    def test_filters_by_deck_id(self, mock_embed, mock_client):
        """Should filter search by deck_id."""
        mock_client.return_value = MagicMock()
        mock_embed.return_value = MagicMock()
        mock_embed.return_value.embed_query.return_value = [0.1, 0.2]
        mock_client.return_value.rpc.return_value.execute.return_value = MagicMock(data=[])

        search_deck_documents.invoke({"query": "test", "deck_id": 42})

        mock_client.return_value.rpc.assert_called_once()
        call_args = mock_client.return_value.rpc.call_args
        payload = call_args.args[1]
        assert payload.get("filter") == {"deck_id": 42}

    @patch("agent.tools._build_supabase_client")
    @patch("agent.tools._build_embedding_model")
    def test_requests_four_results(self, mock_embed, mock_client):
        """Should request k=4 results from similarity search."""
        mock_client.return_value = MagicMock()
        mock_embed.return_value.embed_query.return_value = [0.1, 0.2]
        mock_client.return_value.rpc.return_value.execute.return_value = MagicMock(data=[])

        search_deck_documents.invoke({"query": "test", "deck_id": 1})

        call_args = mock_client.return_value.rpc.call_args
        payload = call_args.args[1]
        assert payload.get("match_count") == 4


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
        # web_search_tool returns a string representation of the results
        assert isinstance(result, str)
        assert "Result 1" in result
        assert "Result 2" in result
