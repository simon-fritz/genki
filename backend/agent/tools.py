from langchain_core.tools import tool
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.vectorstores import SupabaseVectorStore
# Reuse the ingestion utilities from the uploads app
from uploads.services.document_ingestion import _build_embedding_model, _build_supabase_client

# 1. Web Search Tool (for general context)
web_search_tool = TavilySearchResults(max_results=3)

# 2. Scoped RAG Tool
@tool
def search_deck_documents(query: str, deck_id: str) -> str:
    """Search deck-specific ingested documents in Supabase and return concatenated matches."""
    embeddings = _build_embedding_model()
    client = _build_supabase_client()
    
    vector_store = SupabaseVectorStore(
        client=client,
        embedding=embeddings,
        table_name="documents",
        query_name="documents_match" 
    )
    
    # Filter by deck_id
    results = vector_store.similarity_search(
        query, 
        k=4, 
        filter={"deck_id": deck_id}
    )
    
    return "\n\n".join([doc.page_content for doc in results])