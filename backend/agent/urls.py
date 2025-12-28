"""URL configuration for the agent app."""

from django.urls import path

from .views import FlashcardBacksideView, RapidFlashcardBacksideView

urlpatterns = [
    path(
        "flashcard/backside/",
        FlashcardBacksideView.as_view(),
        name="flashcard-backside",
    ),
    path(
        "flashcard/backside/rapid/",
        RapidFlashcardBacksideView.as_view(),
        name="flashcard-backside-rapid",
    ),
]
