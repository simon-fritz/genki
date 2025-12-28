from django.conf import settings
from langchain_core.tools import tool
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.vectorstores import SupabaseVectorStore
# Reuse the ingestion utilities from the uploads app
from uploads.services.document_ingestion import _build_embedding_model, _build_supabase_client

# 1. Web Search Tool (for general context)
web_search_tool = TavilySearchResults(max_results=3)

# 2. Scoped RAG Tool
@tool
def search_deck_documents(query: str, deck_id: int) -> str:
    """Search deck-specific ingested documents in Supabase and return concatenated matches."""
    embeddings = _build_embedding_model()
    client = _build_supabase_client()

    query_embedding = embeddings.embed_query(query)

    query_name = getattr(settings, "SUPABASE_QUERY_NAME", "match_documents")

    res = client.rpc(
        query_name,
        {
            "query_embedding": query_embedding,
            "match_count": 4,
            "filter": {"deck_id": int(deck_id)},
        },
    ).execute()

    rows = res.data or []
    return "\n\n".join(r.get("content", "") for r in rows if r.get("content")) if rows else ""