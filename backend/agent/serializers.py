"""Serializers for the agents app."""
from rest_framework import serializers

class FlashcardRequestSerializer(serializers.Serializer):
    front = serializers.CharField(allow_blank=False, trim_whitespace=True, max_length=2000)
    deck_id = serializers.IntegerField(required=True, help_text="The ID of the deck to search documents in.")

class FlashcardResponseSerializer(serializers.Serializer):
    front = serializers.CharField()
    back = serializers.CharField()
    tags = serializers.ListField(child=serializers.CharField(), required=False)
    generation_meta = serializers.DictField(required=False)
