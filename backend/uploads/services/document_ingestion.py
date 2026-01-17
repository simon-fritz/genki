"""Utilities for ingesting deck documents into Supabase vectors."""

from __future__ import annotations

import uuid
import logging
from typing import Iterable, List, Dict, Any

from django.conf import settings
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from pypdf import PdfReader
from supabase import Client, create_client

logger = logging.getLogger(__name__)


class DocumentIngestionError(Exception):
    """Raised when a document cannot be ingested into the vector store."""

def _batched(items: List[Any], batch_size: int) -> Iterable[List[Any]]:
    """Helper"""
    for i in range(0, len(items), batch_size):
        yield items[i : i + batch_size]

def _build_supabase_client() -> Client:
    url = getattr(settings, "SUPABASE_URL", "")
    key = getattr(settings, "SUPABASE_KEY", "")

    if not url or not key:
        raise DocumentIngestionError(
            "Supabase credentials are not configured. Set SUPABASE_URL and SUPABASE_KEY."
        )

    return create_client(url, key)


def _build_embedding_model() -> GoogleGenerativeAIEmbeddings:
    api_key = getattr(settings, "GEMINI_API_KEY", "")
    if not api_key:
        raise DocumentIngestionError("GEMINI_API_KEY is not configured for embeddings.")

    return GoogleGenerativeAIEmbeddings(
        model="models/gemini-embedding-001",
        task_type="RETRIEVAL_DOCUMENT",
        google_api_key=api_key,
    )


def _extract_pdf_text(uploaded_file) -> str:
    try:
        uploaded_file.seek(0)
        reader = PdfReader(uploaded_file)
        pages_text: List[str] = []
        for page in reader.pages:
            content = page.extract_text() or ""
            if content:
                pages_text.append(content)
    except Exception as exc:  # pragma: no cover - thin wrapper
        raise DocumentIngestionError("Unable to read the uploaded PDF file.") from exc

    combined_text = "\n".join(pages_text).strip()
    if not combined_text:
        raise DocumentIngestionError("Uploaded PDF contains no extractable text.")

    return combined_text


def _split_text(text: str) -> List[str]:
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    return splitter.split_text(text)


def ingest_document(deck, uploaded_file) -> int:
    """
    Ingest a PDF document into Supabase (pgvector)

    Returns:
        Number of chunks inserted.
    """

    # 1) Extract + split
    text = _extract_pdf_text(uploaded_file)
    chunks = _split_text(text)
    if not chunks:
        raise DocumentIngestionError("No content chunks were produced from the upload.")

    # 2) Build clients/models
    embedding_model = _build_embedding_model()
    supabase_client = _build_supabase_client()

    table_name = getattr(settings, "SUPABASE_VECTOR_TABLE", "documents")

    # 3) Prepare Documents
    documents = [
        Document(
            page_content=chunk,
            metadata={
                "deck_id": int(deck.id),
                "deck_name": deck.name,
                "user_id": int(deck.user_id),
                "source": getattr(uploaded_file, "name", ""),
            },
        )
        for chunk in chunks
    ]

    logger.info(
        "Uploading %s document chunks to Supabase table '%s' for deck %s",
        len(documents),
        table_name,
        deck.id,
    )

    # 4) Embed
    texts = [doc.page_content for doc in documents]
    vectors = embedding_model.embed_documents(texts)

    if len(vectors) != len(documents):
        raise DocumentIngestionError(
            f"Embedding count mismatch: got {len(vectors)} vectors for {len(documents)} chunks."
        )

    # 5) Build rows for Supabase insert
    rows = []
    for doc, vec in zip(documents, vectors):
        rows.append(
            {
                "id": str(uuid.uuid4()),
                "content": doc.page_content,
                "metadata": doc.metadata,
                "embedding": vec,  # list[float] length must match vector dims (3072)
            }
        )

    # 6) Insert in batches (payload safety)
    inserted = 0
    for batch in _batched(rows, batch_size=200):
        resp = supabase_client.table(table_name).insert(batch).execute()
        # supabase-py returns resp.data when available; we count by batch size regardless
        inserted += len(batch)

    return inserted

