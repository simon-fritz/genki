from io import BytesIO
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from cards.models import Deck
from uploads.services import document_ingestion
from uploads.services.document_ingestion import DocumentIngestionError, ingest_document


class DeckDocumentUploadApiTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="alice", email="a@example.com", password="pass1234"
        )
        self.other_user = get_user_model().objects.create_user(
            username="bob", email="b@example.com", password="pass1234"
        )

        self.deck = Deck.objects.create(user=self.user, name="Main", description="")
        self.other_deck = Deck.objects.create(
            user=self.other_user, name="Other", description=""
        )

        self.client.force_authenticate(user=self.user)

    def test_upload_document_successful_ingestion(self):
        url = reverse("deck-upload-document", args=[self.deck.id])
        pdf_file = SimpleUploadedFile(
            "notes.pdf", b"%PDF-1.4 test content", content_type="application/pdf"
        )

        with patch("cards.views.ingest_document", return_value=4) as mock_ingest:
            response = self.client.post(url, {"file": pdf_file}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        mock_ingest.assert_called_once()
        called_deck, called_file = mock_ingest.call_args[0]
        self.assertEqual(called_deck, self.deck)
        self.assertEqual(called_file.name, "notes.pdf")
        self.assertEqual(response.data["deck"], self.deck.id)
        self.assertEqual(response.data["filename"], "notes.pdf")
        self.assertEqual(response.data["chunks_ingested"], 4)

    def test_upload_document_validates_pdf_extension(self):
        url = reverse("deck-upload-document", args=[self.deck.id])
        text_file = SimpleUploadedFile(
            "notes.txt", b"plain text", content_type="text/plain"
        )

        with patch("cards.views.ingest_document") as mock_ingest:
            response = self.client.post(url, {"file": text_file}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("file", response.data)
        mock_ingest.assert_not_called()

    def test_upload_document_handles_ingestion_error(self):
        url = reverse("deck-upload-document", args=[self.deck.id])
        pdf_file = SimpleUploadedFile(
            "notes.pdf", b"%PDF-1.4 test content", content_type="application/pdf"
        )

        with patch(
            "cards.views.ingest_document",
            side_effect=DocumentIngestionError("boom"),
        ):
            response = self.client.post(url, {"file": pdf_file}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "INGESTION_FAILED")
        self.assertEqual(response.data["reason"], "boom")

    def test_upload_document_rejects_other_users_deck(self):
        url = reverse("deck-upload-document", args=[self.other_deck.id])
        pdf_file = SimpleUploadedFile(
            "notes.pdf", b"%PDF-1.4 test content", content_type="application/pdf"
        )

        response = self.client.post(url, {"file": pdf_file}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class DocumentIngestionTests(SimpleTestCase):
    def test_build_embedding_model_requires_api_key(self):
        with override_settings(GEMINI_API_KEY=""):
            with self.assertRaises(DocumentIngestionError):
                document_ingestion._build_embedding_model()

    def test_build_supabase_client_requires_credentials(self):
        with override_settings(SUPABASE_URL="", SUPABASE_KEY=""):
            with self.assertRaises(DocumentIngestionError):
                document_ingestion._build_supabase_client()

    def test_extract_pdf_text_requires_content(self):
        mock_page = MagicMock()
        mock_page.extract_text.return_value = ""
        mock_reader = MagicMock(pages=[mock_page])

        with patch(
            "uploads.services.document_ingestion.PdfReader", return_value=mock_reader
        ):
            with self.assertRaises(DocumentIngestionError):
                document_ingestion._extract_pdf_text(BytesIO(b"data"))

    def test_ingest_document_raises_when_no_chunks_created(self):
        deck = SimpleNamespace(id=1, name="Deck", user_id=2)

        with (
            patch(
                "uploads.services.document_ingestion._extract_pdf_text",
                return_value="some text",
            ) as mock_extract,
            patch(
                "uploads.services.document_ingestion._split_text",
                return_value=[],
            ) as mock_split,
            patch(
                "uploads.services.document_ingestion._build_embedding_model"
            ) as mock_embed,
            patch(
                "uploads.services.document_ingestion._build_supabase_client"
            ) as mock_client,
        ):
            with self.assertRaises(DocumentIngestionError):
                ingest_document(deck, BytesIO(b"data"))

        mock_extract.assert_called_once()
        mock_split.assert_called_once()
        mock_embed.assert_not_called()
        mock_client.assert_not_called()

    def test_ingest_document_uploads_chunks_to_supabase(self):
        deck = SimpleNamespace(id=5, name="Docs", user_id=10)
        uploaded_file = SimpleUploadedFile(
            "upload.pdf", b"%PDF-1.4 test content", content_type="application/pdf"
        )
        chunks = ["first chunk", "second chunk"]
        embedding_model = object()
        supabase_client = object()

        with override_settings(
            GEMINI_API_KEY="key", SUPABASE_URL="url", SUPABASE_KEY="key"
        ):
            with (
                patch(
                    "uploads.services.document_ingestion._extract_pdf_text",
                    return_value="some text",
                ),
                patch(
                    "uploads.services.document_ingestion._split_text",
                    return_value=chunks,
                ),
                patch(
                    "uploads.services.document_ingestion._build_embedding_model",
                    return_value=embedding_model,
                ),
                patch(
                    "uploads.services.document_ingestion._build_supabase_client",
                    return_value=supabase_client,
                ),
                patch(
                    "uploads.services.document_ingestion.SupabaseVectorStore.from_documents"
                ) as mock_from_documents,
            ):
                count = ingest_document(deck, uploaded_file)

        self.assertEqual(count, len(chunks))
        mock_from_documents.assert_called_once()
        called_documents = mock_from_documents.call_args.kwargs["documents"]
        self.assertEqual(len(called_documents), len(chunks))
        self.assertEqual(called_documents[0].page_content, "first chunk")
        self.assertEqual(called_documents[0].metadata["deck_id"], deck.id)
        self.assertEqual(called_documents[0].metadata["deck_name"], deck.name)
        self.assertEqual(called_documents[0].metadata["user_id"], deck.user_id)
        self.assertEqual(called_documents[0].metadata["source"], "upload.pdf")
