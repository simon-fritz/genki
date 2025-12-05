"""REST API views for the agents app."""
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .llm import (
    FlashcardGenerationError,
    GuardrailRejectedError,
    generate_flashcard_backside,
)
from .serializers import (
    FlashcardBacksideRequestSerializer,
    FlashcardBacksideResponseSerializer,
)


class FlashcardBacksideView(APIView):
    """Generates the backside of a flashcard using the LangChain agent."""

    swagger_schema_tags = ["Agents"]

    @swagger_auto_schema(
        request_body=FlashcardBacksideRequestSerializer,
        responses={
            200: FlashcardBacksideResponseSerializer,
            400: openapi.Response(
                description="Guardrail blocked the provided content or validation failed.",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "error": openapi.Schema(type=openapi.TYPE_STRING),
                        "reason": openapi.Schema(type=openapi.TYPE_STRING),
                        "guardrail": openapi.Schema(
                            type=openapi.TYPE_OBJECT,
                            properties={
                                "allowed": openapi.Schema(type=openapi.TYPE_BOOLEAN),
                                "severity": openapi.Schema(type=openapi.TYPE_STRING),
                                "reasons": openapi.Schema(
                                    type=openapi.TYPE_ARRAY,
                                    items=openapi.Schema(type=openapi.TYPE_STRING),
                                ),
                                "raw": openapi.Schema(type=openapi.TYPE_STRING),
                            },
                        ),
                    },
                ),
            ),
            502: openapi.Response(
                description="LLM agent failed to generate the backside.",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "error": openapi.Schema(type=openapi.TYPE_STRING),
                        "reason": openapi.Schema(type=openapi.TYPE_STRING),
                    },
                ),
            ),
        },
        operation_description="Generate a flashcard backside using the Gemini-powered agent.",
    )
    def post(self, request, *args, **kwargs):
        request_serializer = FlashcardBacksideRequestSerializer(data=request.data)
        request_serializer.is_valid(raise_exception=True)

        try:
            payload = generate_flashcard_backside(request_serializer.validated_data["front"])
        except GuardrailRejectedError as exc:
            reasons = exc.guardrail_result.get("reasons", [])
            message = "; ".join(filter(None, reasons)) or "Guardrail blocked the provided content."
            return Response(
                {
                    "error": "GUARDRAIL_BLOCKED",
                    "reason": message,
                    "guardrail": exc.guardrail_result,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except FlashcardGenerationError as exc:
            return Response(
                {
                    "error": "GENERATION_FAILED",
                    "reason": str(exc),
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        response_serializer = FlashcardBacksideResponseSerializer(payload)
        return Response(response_serializer.data, status=status.HTTP_200_OK)
