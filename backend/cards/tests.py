from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from .models import Deck, Card


class CardApiTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(
            username="alice", email="a@example.com", password="pass1234"
        )
        self.other_user = get_user_model().objects.create_user(
            username="bob", email="b@example.com", password="pass1234"
        )

        self.deck = Deck.objects.create(user=self.user, name="Main", description="")
        self.other_deck = Deck.objects.create(user=self.other_user, name="Other", description="")

        self.client.force_authenticate(user=self.user)

    def test_create_card_sets_owner_and_default_due_at(self):
        url = reverse("card-list")
        payload = {
            "deck": self.deck.id,
            "front": "Front",
            "back": "Back",
        }

        res = self.client.post(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        card = Card.objects.get(id=res.data["id"])
        self.assertEqual(card.owner, self.user)
        self.assertIsNotNone(card.due_at)

    def test_cannot_use_other_users_deck(self):
        url = reverse("card-list")
        payload = {
            "deck": self.other_deck.id,
            "front": "Front",
            "back": "Back",
        }

        res = self.client.post(url, payload, format="json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("deck", res.data)

    def test_due_endpoint_returns_only_due_cards(self):
        past_due = Card.objects.create(
            owner=self.user,
            deck=self.deck,
            front="Due",
            back="Ans",
            due_at=timezone.now() - timedelta(days=1),
        )
        Card.objects.create(
            owner=self.user,
            deck=self.deck,
            front="Future",
            back="Ans",
            due_at=timezone.now() + timedelta(days=1),
        )
        Card.objects.create(
            owner=self.other_user,
            deck=self.other_deck,
            front="Other",
            back="Ans",
            due_at=timezone.now() - timedelta(days=1),
        )

        url = reverse("card-due")
        res = self.client.get(url)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ids = [item["id"] for item in res.data]
        self.assertEqual(ids, [past_due.id])

    def test_review_accepts_string_rating_and_updates_fields(self):
        card = Card.objects.create(
            owner=self.user,
            deck=self.deck,
            front="Front",
            back="Back",
            due_at=timezone.now(),
            interval=1,
            ease_factor=2.5,
            repetitions=1,
        )

        url = reverse("card-review", args=[card.id])
        res = self.client.post(url, {"rating": "3"}, format="json")

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        card.refresh_from_db()
        self.assertGreaterEqual(card.interval, 1)
        self.assertGreaterEqual(card.repetitions, 2)
        self.assertGreaterEqual(card.ease_factor, 1.3)

    def test_cannot_reassign_card_to_other_users_deck(self):
        card = Card.objects.create(
            owner=self.user,
            deck=self.deck,
            front="Front",
            back="Back",
            due_at=timezone.now(),
        )

        url = reverse("card-detail", args=[card.id])
        res = self.client.patch(url, {"deck": self.other_deck.id}, format="json")

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        card.refresh_from_db()
        self.assertEqual(card.deck_id, self.deck.id)
