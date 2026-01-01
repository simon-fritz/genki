from django.conf import settings
from django.db import models
from django.utils import timezone


class DeckManager(models.Manager):
    """Custom manager for Deck model."""

    pass


class CardManager(models.Manager):
    """Custom manager for Card model with spaced repetition helpers."""

    def due_for_user(self, user):
        """
        Return all cards due for review for a given user.

        Cards are considered due if:
        - They belong to the user
        - due_at <= now() (timezone-aware)

        Args:
            user: The user object (AUTH_USER_MODEL)

        Returns:
            QuerySet of due cards
        """
        return self.filter(
            owner=user,
            due_at__lte=timezone.now(),
        )


class Deck(models.Model):
    """
    A deck is a collection of cards grouped by the user.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="decks"
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = DeckManager()

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"], name="unique_deck_name_per_user"
            )
        ]


class Card(models.Model):
    """A flashcard with minimal spaced repetition tracking."""

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cards"
    )
    deck = models.ForeignKey(
        Deck, on_delete=models.CASCADE, related_name="cards", null=True, blank=True
    )

    # Card content
    front = models.TextField(help_text="Front side text")
    back = models.TextField(help_text="Back side text")

    # Spaced repetition fields (SM-2 algorithm)
    due_at = models.DateTimeField(
        default=timezone.now, help_text="Next scheduled review time"
    )
    interval = models.PositiveIntegerField(
        default=0, help_text="Days until next review"
    )
    ease_factor = models.FloatField(default=2.5, help_text="Ease factor for spacing")
    repetitions = models.PositiveIntegerField(
        default=0, help_text="Count of successful reviews"
    )
    lapses = models.PositiveIntegerField(default=0, help_text="Count of failed reviews")

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    generation_meta = models.JSONField(default=dict, blank=True)

    objects = CardManager()

    def __str__(self):
        """Return a short preview of the card's front side."""
        preview = self.front[:50]
        if len(self.front) > 50:
            preview += "..."
        return preview

    class Meta:
        ordering = ["due_at"]
