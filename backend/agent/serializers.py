"""Serializers for the agents app."""

from rest_framework import serializers


class FlashcardRequestSerializer(serializers.Serializer):
    front = serializers.CharField(
        allow_blank=False, trim_whitespace=True, max_length=2000
    )
    deck_id = serializers.IntegerField(
        required=True, help_text="The ID of the deck to search documents in."
    )


class FlashcardResponseSerializer(serializers.Serializer):
    front = serializers.CharField()
    back = serializers.CharField()
    tags = serializers.ListField(child=serializers.CharField(), required=False)
    generation_meta = serializers.DictField(required=False)


class FlashcardRevisionRequestSerializer(serializers.Serializer):
    front = serializers.CharField(
        allow_blank=False, trim_whitespace=True, max_length=2000
    )
    deck_id = serializers.IntegerField(
        required=True, help_text="The ID of the deck to search documents in."
    )
    previous_backside = serializers.CharField(
        allow_blank=False, trim_whitespace=True, max_length=4000
    )
    feedback = serializers.CharField(
        allow_blank=False, trim_whitespace=True, max_length=2000
    )
