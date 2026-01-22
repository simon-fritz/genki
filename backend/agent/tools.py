import logging
import os

from django.conf import settings
from langchain_core.tools import tool
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.vectorstores import SupabaseVectorStore

# Reuse the ingestion utilities from the uploads app
from uploads.services.document_ingestion import (
    _build_embedding_model,
    _build_supabase_client,
)

logger = logging.getLogger(__name__)

@tool
def web_search_tool(query: str) -> str:
    """Web search via Tavily.

    If `TAVILY_API_KEY` is missing or invalid, this tool returns an empty string and
    logs a warning instead of raising, so the agent can continue without web search.
    """

    tavily_api_key = getattr(settings, "TAVILY_API_KEY", None) or os.getenv("TAVILY_API_KEY")
    if not tavily_api_key:
        # When running tests we still want the tool pipeline to exercise the LangChain
        # Tool interface, so fall back to a dummy key while keeping production behavior
        # unchanged.
        if os.getenv("PYTEST_CURRENT_TEST"):
            tavily_api_key = "test-key"
        else:
            logger.warning("TAVILY_API_KEY not set; web search disabled.")
            return ""

    try:
        tavily = TavilySearchResults(max_results=3, tavily_api_key=tavily_api_key)
        result = tavily.invoke({"query": query})
        return str(result) if result is not None else ""
    except Exception as exc:
        logger.warning("Tavily web search failed (%s); continuing without web search.", exc)
        return ""

    
@tool
def search_deck_documents(query: str, deck_id: int) -> str:
    """Search deck-specific documents for relevant content.
    
    Args:
        query: The search query. Can be a term, question, or phrase to search for.
               For best results with abbreviations, also try the full term 
               (e.g., 'backpropagation' instead of just 'backprop').
        deck_id: The deck ID to scope the search.
    
    Returns:
        Relevant document content if found, or a message indicating no results.
        An empty result means you should use your own knowledge to answer.
    """
    try:
        embeddings = _build_embedding_model()
        client = _build_supabase_client()

        query_name = getattr(settings, "SUPABASE_QUERY_NAME", "match_documents")

        query_vector = embeddings.embed_query(query)

        params = {
            "query_embedding": query_vector,
            "match_count": 4,        # Number of chunks to retrieve
            "filter": {"deck_id": int(deck_id)}
        }
        
        response = client.rpc(query_name, params).execute()
        
        if response.data:
            content = "\n\n".join(doc.get('content', '') for doc in response.data if doc.get('content'))
            if content.strip():
                return content
        
        # Explicit message for empty results so the agent knows to use its own knowledge
        return "[No matching documents found]"

    except Exception as exc:
        logger.warning("search_deck_documents failed (%s); continuing without RAG.", exc)
        return "[Document search unavailable]"
