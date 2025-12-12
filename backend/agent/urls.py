"""URL configuration for the agent app."""
from django.urls import path

from .views import FlashcardBacksideView

urlpatterns = [
    path("flashcard/backside/", FlashcardBacksideView.as_view(), name="flashcard-backside"),
]
