from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from .models import UserProfile

ALLOWED_PREF_KEYS = {
    "verbosity",
    "structure",
    "include_examples",
    "examples_per_answer",
    "include_analogies",
    "analogy_domain",
    "step_by_step",
    "socratic_mode",
    "include_mnemonic",
    "quiz_at_end",
    "language",
    "difficulty",
    "auto_tune",
}

ALLOWED_WEIGHT_KEYS = {
    "examples",
    "analogies",
    "step_by_step",
    "mnemonic",
    "quiz",
    "visual",
    "concise",
}


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email")
        read_only_fields = ("id",)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ("username", "email", "password", "password2")

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match."}
            )
        return attrs

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    username_or_email = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from django.contrib.auth import authenticate

        username_or_email = attrs["username_or_email"]
        password = attrs["password"]

        # Try to authenticate with username first
        user = authenticate(username=username_or_email, password=password)

        # If not found, try to find user by email and authenticate
        if not user:
            try:
                user_obj = User.objects.get(email__iexact=username_or_email)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                pass

        if not user:
            raise serializers.ValidationError("Invalid credentials.")
        attrs["user"] = user
        return attrs


class TokenResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()


class RefreshTokenSerializer(TokenRefreshSerializer):
    pass


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["preferences", "weights", "generations", "reviews", "updated_at"]


class UserProfileUpdateSerializer(serializers.Serializer):
    preferences = serializers.DictField(required=False)
    weights = serializers.DictField(required=False)

    def validate_preferences(self, prefs):
        unknown = set(prefs.keys()) - ALLOWED_PREF_KEYS
        if unknown:
            raise serializers.ValidationError(
                f"Unknown preference keys: {sorted(unknown)}"
            )
        return prefs

    def validate_weights(self, weights):
        unknown = set(weights.keys()) - ALLOWED_WEIGHT_KEYS
        if unknown:
            raise serializers.ValidationError(f"Unknown weight keys: {sorted(unknown)}")
        for k, v in weights.items():
            try:
                fv = float(v)
            except Exception:
                raise serializers.ValidationError(f"Weight '{k}' must be a number.")
            if fv < 0 or fv > 1:
                raise serializers.ValidationError(
                    f"Weight '{k}' must be between 0 and 1."
                )
        return weights
