"""URL configuration for the agent app."""

from django.urls import path

from .views import (
    FlashcardBacksideRevisionView,
    FlashcardBacksideView,
    RapidFlashcardBacksideRevisionView,
    RapidFlashcardBacksideView,
)

urlpatterns = [
    path(
        "flashcard/backside/",
        FlashcardBacksideView.as_view(),
        name="flashcard-backside",
    ),
    path(
        "flashcard/backside/revise/",
        FlashcardBacksideRevisionView.as_view(),
        name="flashcard-backside-revision",
    ),
path(
        "flashcard/rapid/backside",
        RapidFlashcardBacksideView.as_view(),
        name="flashcard-backside-rapid-noslash",
    ),
    path(
        "flashcard/rapid/backside/",
        RapidFlashcardBacksideView.as_view(),
        name="flashcard-backside-rapid",
    ),
    path(
        "flashcard/rapid/backside/revise",
        RapidFlashcardBacksideRevisionView.as_view(),
        name="flashcard-backside-rapid-revision-noslash",
    ),
    path(
        "flashcard/rapid/backside/revise/",
        RapidFlashcardBacksideRevisionView.as_view(),
        name="flashcard-backside-rapid-revision",
    ),
]
