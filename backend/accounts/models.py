from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

# Using Django's default User model, no additional models needed
def default_preferences():
    return {
        "verbosity": "balanced",          # concise | balanced | detailed
        "structure": "sections",          # sections | bullets | paragraph
        "include_examples": True,
        "examples_per_answer": 1,
        "include_analogies": False,
        "analogy_domain": "coding",       # coding | everyday | math
        "step_by_step": True,
        "socratic_mode": False,
        "include_mnemonic": False,
        "quiz_at_end": False,
        "language": "en",
        "difficulty": "auto",             # auto | beginner | intermediate | advanced
        "auto_tune": True,                # allow implicit tuning via reviews
    }


def default_weights():
    # 0..1 weights used to decide how strongly to apply each style feature
    return {
        "examples": 0.60,
        "analogies": 0.30,
        "step_by_step": 0.55,
        "mnemonic": 0.20,
        "quiz": 0.20,
        "visual": 0.35,
        "concise": 0.40,
    }


class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    preferences = models.JSONField(default=default_preferences)
    weights = models.JSONField(default=default_weights)

    generations = models.PositiveIntegerField(default=0)
    reviews = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile({self.user_id})"