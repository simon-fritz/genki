from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from rest_framework.permissions import IsAuthenticated
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from .serializers import FlashcardRequestSerializer, FlashcardResponseSerializer


from cards.models import Deck

from .llm_graph import app, llm
from .state import AgentState


class RapidFlashcardRequestSerializer(serializers.Serializer):
    front = serializers.CharField()


class FlashcardBacksideView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        request_body=FlashcardRequestSerializer,
        responses={
            200: openapi.Response(
                description="Generated backside using RAG + user preferences.",
                schema=FlashcardResponseSerializer(),
            ),
            400: openapi.Response(
                description="Blocked by safety guardrail or invalid input.",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "error": openapi.Schema(type=openapi.TYPE_STRING),
                        "reason": openapi.Schema(type=openapi.TYPE_STRING),
                        "details": openapi.Schema(type=openapi.TYPE_STRING),
                    },
                ),
            ),
            401: openapi.Response(
                description="Unauthorized (missing/invalid Bearer token).",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={"detail": openapi.Schema(type=openapi.TYPE_STRING)},
                ),
            ),
            404: openapi.Response(
                description="Deck not found or does not belong to the user.",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={"error": openapi.Schema(type=openapi.TYPE_STRING)},
                ),
            ),
            500: openapi.Response(
                description="Agent pipeline failure.",
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        "error": openapi.Schema(type=openapi.TYPE_STRING),
                        "details": openapi.Schema(type=openapi.TYPE_STRING),
                    },
                ),
            ),
        },
        security=[{"Bearer": []}],
        operation_description=(
            "Generate the backside of an Anki card.\n\n"
            "Pipeline:\n"
            "- Loads user's learning preferences\n"
            "- Uses RAG (search_deck_documents) scoped to deck_id\n"
            "- Generates a personalized answer\n\n"
            "Returns generation_meta so you can store it on the Card and later auto-tune preferences."
        ),
        tags=["GenAI"],
    )
    def post(self, request):
        serializer = FlashcardRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        # Ensure deck_id is an integer (coerce if necessary)
        deck_id_raw = data.get("deck_id")
        try:
            deck_id = int(deck_id_raw)
        except (TypeError, ValueError):
            return Response(
                {"error": "deck_id must be an integer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        data["deck_id"] = deck_id

        # Ensure deck belongs to user
        deck = Deck.objects.filter(id=deck_id, user=request.user).first()
        if not deck:
            return Response(
                {"error": "Deck not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Initialize State
        initial_state: AgentState = {
            "messages": [HumanMessage(content=data["front"])],
            "front": data["front"],
            "deck_id": deck.id,
            "user_id": request.user.id if request.user.is_authenticated else 0,
            "critique_count": 0,
            # Defaults
            "is_safe": True,
            "safety_reason": "",
            "draft_answer": "",
            "user_preferences": "",
            "user_weights": {},
            "deck_context": "",
            "style_instructions": "",
            "features_used": [],
            "generation_meta": {},
            "final_json": {},
        }

        try:
            # Run the Graph
            final_state = app.invoke(initial_state)

            # Check for Safety Rejection
            if not final_state["is_safe"]:
                return Response(
                    {
                        "error": "Content Blocked",
                        "reason": final_state["safety_reason"],
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Return final formatted JSON
            return Response(final_state["final_json"], status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": "Agent Failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class RapidFlashcardBacksideView(APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(request_body=RapidFlashcardRequestSerializer)
    def post(self, request):
        serializer = RapidFlashcardRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        front_text = data["front"].strip()

        if not front_text:
            return Response(
                {"error": "Front cannot be empty."}, status=status.HTTP_400_BAD_REQUEST
            )

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "You write only the back side of a flashcard as compact Markdown (<=120 words)."
                    " Use bullet points or short paragraphs. Avoid headings, front-matter, and code fences."
                    " Output ONLY the back text, nothing else.",
                ),
                ("human", "Front: {front}"),
            ]
        )

        try:
            back_text = prompt | llm
            response = back_text.invoke({"front": front_text})
            back_markdown = getattr(response, "content", str(response))

            return Response(
                {"front": front_text, "back": back_markdown},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            return Response(
                {"error": "Generation Failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
