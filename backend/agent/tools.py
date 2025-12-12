from langchain_core.tools import tool
from langchain_community.tools.tavily_search import TavilySearchResults

# 1. Web Search Tool (for general context)
web_search_tool = TavilySearchResults(max_results=3)

# 2. Scoped RAG Tool
@tool
def search_deck_documents(query: str, deck_id: str) -> str:
    """
    Search for information strictly within the documents uploaded to a specific deck.
    Useful for finding definitions, facts, or context specific to the user's uploaded slides/books.
    """
    # TODO: Replace this with actual Vector DB call
    # Example Logic:
    # vector_store.similarity_search(query, filter={"deck_id": deck_id})
    
    # Mock return for now
    return f"[Mock RAG Result] Found docs in Deck {deck_id} relevant to: {query}."