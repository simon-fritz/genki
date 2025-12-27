from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from .models import UserProfile
from .serializers import UserProfileSerializer, UserProfileUpdateSerializer

from .serializers import (
    RegisterSerializer, 
    LoginSerializer, 
    UserSerializer, 
    RefreshTokenSerializer
)

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


@swagger_auto_schema(
    method='post',
    request_body=RegisterSerializer,
    responses={
        201: openapi.Response(
            'User registered successfully',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'username': openapi.Schema(type=openapi.TYPE_STRING),
                    'email': openapi.Schema(type=openapi.TYPE_STRING),
                }
            )
        ),
        400: openapi.Response('Bad Request - Validation error', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
    },
    security=[],
    operation_description='Register a new user account',
    tags=['Authentication']
)
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Register a new user."""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {
                'id': user.id,
                'username': user.username,
                'email': user.email,
            },
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@swagger_auto_schema(
    method='post',
    request_body=LoginSerializer,
    responses={
        200: openapi.Response(
            'Login successful',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'access': openapi.Schema(type=openapi.TYPE_STRING, description='Access token (expires in 2 hours)'),
                    'refresh': openapi.Schema(type=openapi.TYPE_STRING, description='Refresh token (expires in 1 day)'),
                    'user': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                            'username': openapi.Schema(type=openapi.TYPE_STRING),
                            'email': openapi.Schema(type=openapi.TYPE_STRING),
                        }
                    ),
                }
            )
        ),
        401: openapi.Response('Invalid credentials', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
    },
    security=[],
    operation_description='Login with username or email and receive JWT tokens',
    tags=['Authentication']
)
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Login user and return JWT tokens."""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


@swagger_auto_schema(
    method='get',
    responses={
        200: openapi.Response(
            'User data',
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'id': openapi.Schema(type=openapi.TYPE_INTEGER),
                    'username': openapi.Schema(type=openapi.TYPE_STRING),
                    'email': openapi.Schema(type=openapi.TYPE_STRING),
                }
            )
        ),
        401: openapi.Response('Unauthorized - Invalid or missing token', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
    },
    security=[{'Bearer': []}],
    operation_description='Get current authenticated user data (requires JWT token)',
    tags=['Authentication']
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_info(request):
    """Get current authenticated user's information."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


class CustomTokenRefreshView(TokenRefreshView):
    """
    Refresh JWT token endpoint.
    """
    serializer_class = RefreshTokenSerializer

    @swagger_auto_schema(
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                'refresh': openapi.Schema(type=openapi.TYPE_STRING, description='Refresh token from login response'),
            },
            required=['refresh']
        ),
        responses={
            200: openapi.Response(
                'Token refreshed successfully',
                schema=openapi.Schema(
                    type=openapi.TYPE_OBJECT,
                    properties={
                        'access': openapi.Schema(type=openapi.TYPE_STRING, description='New access token (expires in 2 hours)'),
                        'refresh': openapi.Schema(type=openapi.TYPE_STRING, description='New refresh token (expires in 1 day)'),
                    }
                )
            ),
            401: openapi.Response('Invalid or expired refresh token', schema=openapi.Schema(type=openapi.TYPE_OBJECT)),
        },
        security=[],
        operation_description='Refresh JWT access token and receive new tokens',
        tags=['Authentication']
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

@swagger_auto_schema(
    method="get",
    responses={
        200: openapi.Response(
            description="Current user's GenAI preferences and weights.",
            schema=UserProfileSerializer(),
        ),
        401: openapi.Response(
            description="Unauthorized",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "detail": openapi.Schema(type=openapi.TYPE_STRING),
                },
            ),
        ),
    },
    security=[{"Bearer": []}],
    operation_description="Fetch the authenticated user's learning preferences used for GenAI personalization.",
    tags=["Authentication"],
)
@swagger_auto_schema(
    method="patch",
    request_body=UserProfileUpdateSerializer,
    responses={
        200: openapi.Response(
            description="Updated preferences and weights.",
            schema=UserProfileSerializer(),
        ),
        400: openapi.Response(
            description="Validation error (unknown keys or invalid weights).",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    "preferences": openapi.Schema(type=openapi.TYPE_OBJECT),
                    "weights": openapi.Schema(type=openapi.TYPE_OBJECT),
                    "detail": openapi.Schema(type=openapi.TYPE_STRING),
                },
            ),
        ),
        401: openapi.Response(
            description="Unauthorized",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={"detail": openapi.Schema(type=openapi.TYPE_STRING)},
            ),
        ),
    },
    security=[{"Bearer": []}],
    operation_description=(
        "Partially update the authenticated user's learning preferences and/or tuning weights.\n\n"
        "Example body:\n"
        "{\n"
        '  "preferences": {"verbosity": "concise", "include_analogies": true},\n'
        '  "weights": {"analogies": 0.8}\n'
        "}"
    ),
    tags=["Authentication"],
)
@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
def preferences(request):
    profile, _ = UserProfile.objects.get_or_create(user=request.user)

    if request.method == "GET":
        return Response(UserProfileSerializer(profile).data, status=status.HTTP_200_OK)

    # PATCH
    serializer = UserProfileUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    prefs_patch = serializer.validated_data.get("preferences", {})
    weights_patch = serializer.validated_data.get("weights", {})

    new_prefs = {**profile.preferences, **prefs_patch}
    new_weights = {**profile.weights, **weights_patch}

    profile.preferences = new_prefs
    profile.weights = new_weights
    profile.save(update_fields=["preferences", "weights", "updated_at"])

    return Response(UserProfileSerializer(profile).data, status=status.HTTP_200_OK)