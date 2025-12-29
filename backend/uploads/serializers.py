from rest_framework import serializers


class DeckDocumentUploadSerializer(serializers.Serializer):
    """Serializer to validate uploaded deck documents."""

    file = serializers.FileField(help_text="PDF document to ingest into the deck")

    def validate_file(self, uploaded):
        name = getattr(uploaded, "name", "")
        if not name.lower().endswith(".pdf"):
            raise serializers.ValidationError("Only PDF uploads are supported.")
        return uploaded
