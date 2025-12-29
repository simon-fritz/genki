from rest_framework import serializers
from .models import Deck, Card


class DeckSerializer(serializers.ModelSerializer):
    """Lightweight deck serializer for CRUD."""

    class Meta:
        model = Deck
        fields = [
            "id",
            "name",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CardSerializer(serializers.ModelSerializer):
    """Card serializer with ownership checks."""

    class Meta:
        model = Card
        fields = [
            "id",
            "deck",
            "front",
            "back",
            "generation_meta",
            "due_at",
            "interval",
            "ease_factor",
            "repetitions",
            "lapses",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_generation_meta(self, meta):
        if meta is None:
            return {}
        if not isinstance(meta, dict):
            raise serializers.ValidationError("generation_meta must be an object.")
        # Keep it small + safe
        allowed_keys = {"prompt_version", "features_used", "rag_used", "sources"}
        unknown = set(meta.keys()) - allowed_keys
        if unknown:
            raise serializers.ValidationError(
                f"Unknown generation_meta keys: {sorted(unknown)}"
            )
        return meta

    def validate_deck(self, deck):
        """Ensure the deck (if set) belongs to the current user."""
        if deck is None:
            return deck

        request = self.context.get("request")
        user = getattr(request, "user", None)
        if user is None or user.is_anonymous:
            raise serializers.ValidationError(
                "Deck selection requires an authenticated user."
            )

        if deck.user_id != user.id:
            raise serializers.ValidationError("You can only use your own decks.")

        return deck


class CardReviewSerializer(serializers.Serializer):
    """Validate review payloads submitted from the study session."""

    rating = serializers.IntegerField(
        min_value=0,
        max_value=3,
        help_text="Spaced repetition rating where 0 is a lapse and 3 is easy.",
    )
