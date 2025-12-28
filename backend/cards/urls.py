"""
URL routing for the cards app API.

Registers DRF viewsets for Deck and Card models using DefaultRouter,
exposing RESTful endpoints under /api/decks/ and /api/cards/.
"""

from rest_framework.routers import DefaultRouter
from .views import DeckViewSet, CardViewSet

# Create a DRF router and register the viewsets
router = DefaultRouter()
router.register("decks", DeckViewSet, basename="deck")
router.register("cards", CardViewSet, basename="card")

# Expose the generated URL patterns
urlpatterns = router.urls
