"""REST endpoints for decks and cards with basic spaced repetition."""

from datetime import timedelta

from accounts.models import UserProfile
from accounts.services.preferences import update_profile_from_review
from django.utils import timezone
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from uploads.serializers import DeckDocumentUploadSerializer
from uploads.services.document_ingestion import DocumentIngestionError, ingest_document

from .models import Card, Deck
from .serializers import (
    CardReviewSerializer,
    CardSerializer,
    DeckSerializer,
    DuplicateDeckNameError,
)


class DeckViewSet(viewsets.ModelViewSet):
    """CRUD for decks scoped to the authenticated user."""

    serializer_class = DeckSerializer
    permission_classes = [IsAuthenticated]
    swagger_schema_tags = ["Decks"]

    def get_queryset(self):
        """Return only decks belonging to the current user, ordered by name."""
        request = getattr(self, "request", None)
        if getattr(self, "swagger_fake_view", False) or request is None:
            return Deck.objects.none()

        return Deck.objects.filter(user=request.user).order_by("name")

    def perform_create(self, serializer):
        """Automatically set the deck owner to the current user on creation."""
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        """Create a deck, returning 409 if name is duplicate."""
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except DuplicateDeckNameError as exc:
            return Response(
                {"error": "DUPLICATE_DECK_NAME", "message": str(exc)},
                status=status.HTTP_409_CONFLICT,
            )
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def update(self, request, *args, **kwargs):
        """Update a deck, returning 409 if name is duplicate."""
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        try:
            serializer.is_valid(raise_exception=True)
        except DuplicateDeckNameError as exc:
            return Response(
                {"error": "DUPLICATE_DECK_NAME", "message": str(exc)},
                status=status.HTTP_409_CONFLICT,
            )
        self.perform_update(serializer)
        return Response(serializer.data)

    @swagger_auto_schema(
        method="post",
        request_body=DeckDocumentUploadSerializer,
        responses={
            201: openapi.Response(
                description="Document ingested and embedded into Supabase.",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "deck": openapi.Schema(type=openapi.TYPE_INTEGER),
                        "filename": openapi.Schema(type=openapi.TYPE_STRING),
                        "chunks_ingested": openapi.Schema(type=openapi.TYPE_INTEGER),
                    },
                ),
            ),
            400: openapi.Response(
                description="Validation or ingestion error.",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "error": openapi.Schema(type=openapi.TYPE_STRING),
                        "reason": openapi.Schema(type=openapi.TYPE_STRING),
                    },
                ),
            ),
        },
        operation_description=(
            "Upload a PDF, split it into chunks, embed the content, and store vectors in Supabase."
        ),
    )
    @action(
        detail=True,
        methods=["post"],
        url_path="upload-document",
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_document(self, request, pk=None):
        """Upload a PDF to a deck and store its embeddings in Supabase."""

        deck = self.get_object()
        serializer = DeckDocumentUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uploaded_file = serializer.validated_data["file"]

        try:
            chunks_ingested = ingest_document(deck, uploaded_file)
        except DocumentIngestionError as exc:
            return Response(
                {"error": "INGESTION_FAILED", "reason": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "deck": deck.id,
                "filename": getattr(uploaded_file, "name", None),
                "chunks_ingested": chunks_ingested,
            },
            status=status.HTTP_201_CREATED,
        )


class CardViewSet(viewsets.ModelViewSet):
    """CRUD for the cards scoped to the authenticated user."""

    serializer_class = CardSerializer
    permission_classes = [IsAuthenticated]
    swagger_schema_tags = ["Cards"]

    def get_queryset(self):
        """Return cards for the current user, optionally filtered by deck."""
        request = getattr(self, "request", None)
        if getattr(self, "swagger_fake_view", False) or request is None:
            return Card.objects.none()

        queryset = Card.objects.filter(owner=request.user).order_by(
            "due_at", "created_at"
        )

        # Filter by deck if provided as a query parameter
        deck_id = request.query_params.get("deck") if request else None
        if deck_id:
            queryset = queryset.filter(deck_id=deck_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=["get"])
    def due(self, request):
        """Return cards currently due for the requester."""
        cards = Card.objects.due_for_user(request.user)
        serializer = self.get_serializer(cards, many=True)
        return Response(serializer.data)

    @swagger_auto_schema(
        method="post",
        request_body=CardReviewSerializer,
        responses={
            200: CardSerializer,
            400: openapi.Response(
                description="Invalid rating payload",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "rating": openapi.Schema(
                            type=openapi.TYPE_ARRAY,
                            items=openapi.Schema(type=openapi.TYPE_STRING),
                        ),
                        "detail": openapi.Schema(type=openapi.TYPE_STRING),
                    },
                ),
            ),
        },
        operation_description="Submit a 0-3 spaced repetition rating for this card.",
    )
    @action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        """Handle POST /api/cards/{id}/review/ with rating 0-3."""
        card = self.get_object()

        input_serializer = CardReviewSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        rating = input_serializer.validated_data["rating"]

        # ===== Simplified SM-2 Algorithm Implementation =====
        # Adjust these parameters based on your learning goals

        if rating < 2:
            # Poor performance: reset repetitions and increase lapses
            card.repetitions = 0
            card.lapses += 1
            card.interval = 1  # retry tomorrow
        else:
            # Good performance: increment repetitions
            card.repetitions += 1

            if card.repetitions == 1:
                card.interval = 1  # first review: 1 day
            elif card.repetitions == 2:
                card.interval = 3  # second review: 3 days
            else:
                # Subsequent reviews: use ease_factor to space out intervals
                card.interval = max(1, int(card.interval * card.ease_factor))

        # Update ease_factor based on rating (SM-2 formula)
        # EF' = EF + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02))
        if rating >= 2:
            card.ease_factor = max(
                1.3,  # minimum ease factor
                card.ease_factor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02)),
            )
        else:
            card.ease_factor = max(1.3, card.ease_factor - 0.2)

        # Set next due time based on interval
        now = timezone.now()
        card.due_at = now + timedelta(days=card.interval)

        # Save the updated card
        card.save()

        # Tune preferences
        features_used = (card.generation_meta or {}).get("features_used", [])
        try:
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            if profile.preferences.get("auto_tune", True):
                update_profile_from_review(profile, rating, features_used)
        except Exception:
            # never block studying if tuning fails
            pass

        # Return the updated card as JSON
        serializer = self.get_serializer(card)
        return Response(serializer.data, status=status.HTTP_200_OK)
