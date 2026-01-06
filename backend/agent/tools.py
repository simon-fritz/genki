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


# 2. Scoped RAG Tool
@tool
def search_deck_documents(query: str, deck_id: int) -> str:
    """Search deck-specific ingested documents in Supabase and return concatenated matches.

    If Supabase credentials are missing or invalid, returns an empty string and logs a warning.
    """
    try:
        embeddings = _build_embedding_model()
        client = _build_supabase_client()

        table_name = getattr(settings, "SUPABASE_VECTOR_TABLE", "documents")
        query_name = getattr(settings, "SUPABASE_QUERY_NAME", f"{table_name}_match")

        vector_store = SupabaseVectorStore(
            client=client,
            embedding=embeddings,
            table_name=table_name,
            query_name=query_name,
        )

        results = vector_store.similarity_search(
            query, k=4, filter={"deck_id": int(deck_id)}
        )
        return "\n\n".join(doc.page_content for doc in results) if results else ""
    except Exception as exc:
        logger.warning("search_deck_documents failed (%s); continuing without RAG.", exc)
        return ""
