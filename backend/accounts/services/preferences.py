from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Tuple

from accounts.models import UserProfile

RATING_TO_REWARD = {
    0: -1.0,  # lapse
    1: -0.3,  # hard
    2: 0.3,  # good
    3: 1.0,  # easy
}

KNOWN_FEATURES = {
    "examples",
    "analogies",
    "step_by_step",
    "mnemonic",
    "quiz",
    "visual",
    "concise",
}


def _clip01(x: float) -> float:
    return max(0.0, min(1.0, x))


def update_profile_from_review(
    profile: UserProfile,
    rating: int,
    features_used: List[str],
    alpha: float = 0.05,
    weight:float = 1.0
) -> UserProfile:
    """
    Simple reinforcement update:
    - If rating is high and a feature was used, increase its weight.
    - If rating is low and a feature was used, decrease its weight.
    - Other features gently decay toward neutral (0.5).
    """
    reward = RATING_TO_REWARD.get(rating, 0.0)
    scaled_alpha= alpha * max(0.0, weight)
    weights: Dict[str, float] = dict(profile.weights or {})

    used = {f for f in features_used if f in KNOWN_FEATURES}

    for feat in KNOWN_FEATURES:
        w = float(weights.get(feat, 0.5))

        if feat in used:
            w = _clip01(w + scaled_alpha * reward)
        else:
            # tiny drift toward 0.5 (neutral)
            w = _clip01(w + scaled_alpha * (0.5 - w) * 0.05)

        weights[feat] = w

    profile.weights = weights
    profile.reviews += 1
    profile.save(update_fields=["weights", "reviews", "updated_at"])
    return profile

def apply_weight_patch(
    profile: UserProfile,
    weights_patch: Dict[str, float],
    weight: float = 1.0,
) -> UserProfile:
    if not weights_patch:
        return profile

    weights: Dict[str, float] = dict(profile.weights or {})
    scale = max(0.0, weight)

    for feat, delta in weights_patch.items():
        if feat not in KNOWN_FEATURES:
            continue
        try:
            delta_value = float(delta)
        except (TypeError, ValueError):
            continue
        current = float(weights.get(feat, 0.5))
        weights[feat] = _clip01(current + delta_value * scale)

    profile.weights = weights
    profile.save(update_fields=["weights", "updated_at"])
    return profile
