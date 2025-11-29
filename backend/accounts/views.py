from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from django.contrib.auth.models import User

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
        operation_description='Refresh JWT access token and receive new tokens',
        tags=['Authentication']
    )
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        # Add new refresh token to response
        if response.status_code == 200:
            refresh = RefreshToken(request.data['refresh'])
            response.data['refresh'] = str(refresh)
        
        return response

