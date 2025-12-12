"""Serializers for the agents app."""
from rest_framework import serializers


class FlashcardBacksideRequestSerializer(serializers.Serializer):
    front = serializers.CharField(allow_blank=False, trim_whitespace=True, max_length=2000)


class GuardrailResultSerializer(serializers.Serializer):
    allowed = serializers.BooleanField()
    severity = serializers.CharField()
    reasons = serializers.ListField(child=serializers.CharField(), allow_empty=True)
    raw = serializers.CharField(required=False, allow_blank=True)


class FlashcardBacksideResponseSerializer(serializers.Serializer):
    front = serializers.CharField()
    back = serializers.CharField()
    guardrail = GuardrailResultSerializer()
