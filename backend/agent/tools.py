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

# 1. Web Search Tool (for general context)
_tavily_api_key = getattr(settings, "TAVILY_API_KEY", None) or os.getenv(
    "TAVILY_API_KEY"
)

# Ensure the environment variable is set so TavilySearchResults validation passes
if not _tavily_api_key:
    _tavily_api_key = "DUMMY_TAVILY_API_KEY"
    os.environ.setdefault("TAVILY_API_KEY", _tavily_api_key)

web_search_tool = TavilySearchResults(max_results=3, tavily_api_key=_tavily_api_key)


# 2. Scoped RAG Tool
@tool
def search_deck_documents(query: str, deck_id: int) -> str:
    """Search deck-specific ingested documents in Supabase and return concatenated matches."""
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
