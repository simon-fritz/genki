from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, serializers
from drf_yasg.utils import swagger_auto_schema
from langchain_core.messages import HumanMessage

from .llm_graph import app
from .state import AgentState

class FlashcardRequestSerializer(serializers.Serializer):
    front = serializers.CharField()
    deck_id = serializers.CharField(default="default_deck")

class FlashcardBacksideView(APIView):
    
    @swagger_auto_schema(request_body=FlashcardRequestSerializer)
    def post(self, request):
        serializer = FlashcardRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        # Initialize State
        initial_state: AgentState = {
            "messages": [HumanMessage(content=data["front"])],
            "front": data["front"],
            "deck_id": data["deck_id"],
            "user_id": request.user.id if request.user.is_authenticated else 0,
            "critique_count": 0,
            # Defaults
            "is_safe": True, 
            "safety_reason": "",
            "draft_answer": "",
            "user_preferences": "",
            "deck_context": "",
            "final_json": {}
        }
        
        try:
            # Run the Graph
            final_state = app.invoke(initial_state)
            
            # Check for Safety Rejection
            if not final_state["is_safe"]:
                return Response(
                    {"error": "Content Blocked", "reason": final_state["safety_reason"]},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Return final formatted JSON
            return Response(final_state["final_json"], status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": "Agent Failed", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )