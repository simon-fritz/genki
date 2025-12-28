from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from cards.models import Deck
from accounts.models import UserProfile
from .prompting import build_style_instructions
from .state import AgentState
from .tools import search_deck_documents


class PromptingTests(TestCase):
    """Tests for prompt building logic"""

    def test_default_preferences(self):
        style, features = build_style_instructions({}, {})
        self.assertIn("balanced", style.lower())

    def test_concise_verbosity(self):
        style, _ = build_style_instructions({"verbosity": "concise"}, {})
        self.assertIn("120 words", style)

    def test_analogies_triggered_by_weight(self):
        _, features = build_style_instructions({}, {"analogies": 0.6})
        self.assertIn("analogies", features)


class ToolsTests(TestCase):
    """Tests for agent tools"""

    @patch("agent.tools._build_supabase_client")
    @patch("agent.tools._build_embedding_model")
    def test_search_deck_documents_returns_empty_on_no_results(
        self, mock_embed, mock_client
    ):
        # Mock vector store returning no results
        mock_client.return_value = MagicMock()
        mock_embed.return_value = MagicMock()

        with patch("agent.tools.SupabaseVectorStore") as mock_vs:
            mock_vs.return_value.similarity_search.return_value = []
            result = search_deck_documents.invoke({"query": "test", "deck_id": 1})
            self.assertEqual(result, "")


class FlashcardBacksideViewTests(APITestCase):
    """Integration tests for the agent endpoint"""

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="testpass")
        self.deck = Deck.objects.create(user=self.user, name="Test Deck")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_requires_authentication(self):
        self.client.logout()
        response = self.client.post(
            "/api/agent/flashcard/backside/",
            {"front": "What is Python?", "deck_id": self.deck.id},
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_deck_id_returns_404(self):
        response = self.client.post(
            "/api/agent/flashcard/backside/",
            {"front": "What is Python?", "deck_id": 99999},
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_deck_must_belong_to_user(self):
        other_user = User.objects.create_user(username="other", password="pass")
        other_deck = Deck.objects.create(user=other_user, name="Other Deck")

        response = self.client.post(
            "/api/agent/flashcard/backside/",
            {"front": "Test", "deck_id": other_deck.id},
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    @patch("agent.llm_graph.app.invoke")
    def test_successful_generation(self, mock_invoke):
        mock_invoke.return_value = {
            "is_safe": True,
            "final_json": {
                "front": "What is Python?",
                "back": "A programming language",
                "tags": [],
                "generation_meta": {},
            },
        }

        response = self.client.post(
            "/api/agent/flashcard/backside/",
            {"front": "What is Python?", "deck_id": self.deck.id},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("back", response.data)

    @patch("agent.llm_graph.app.invoke")
    def test_unsafe_content_blocked(self, mock_invoke):
        mock_invoke.return_value = {
            "is_safe": False,
            "safety_reason": "Inappropriate content",
        }

        response = self.client.post(
            "/api/agent/flashcard/backside/",
            {"front": "bad content", "deck_id": self.deck.id},
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("reason", response.data)


class RapidFlashcardViewTests(APITestCase):
    """Tests for the rapid (simplified) endpoint"""

    def setUp(self):
        self.user = User.objects.create_user(username="testuser", password="testpass")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    @patch("agent.views.llm")
    def test_rapid_generation(self, mock_llm):
        mock_response = MagicMock()
        mock_response.content = "This is the back of the card"
        mock_llm.__or__ = lambda self, other: MagicMock(invoke=lambda x: mock_response)

        response = self.client.post(
            "/api/agent/flashcard/backside/rapid/", {"front": "What is AI?"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
