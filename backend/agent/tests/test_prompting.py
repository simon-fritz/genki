"""
Tests for the prompting module.
"""

import pytest
from agent.prompting import build_style_instructions


class TestBuildStyleInstructions:
    """Test suite for build_style_instructions function."""

    def test_default_preferences_returns_balanced(self):
        """Default preferences should return balanced style."""
        style, features = build_style_instructions({}, {})
        assert "balanced" in style.lower() or "150-220 words" in style

    def test_concise_verbosity(self):
        """Concise verbosity should limit to 120 words."""
        style, _ = build_style_instructions({"verbosity": "concise"}, {})
        assert "120 words" in style

    def test_detailed_verbosity(self):
        """Detailed verbosity should allow 200-350 words."""
        style, _ = build_style_instructions({"verbosity": "detailed"}, {})
        assert "200-350 words" in style

    def test_sections_structure(self):
        """Sections structure should include definition, key points, etc."""
        style, _ = build_style_instructions({"structure": "sections"}, {})
        assert "Definition" in style
        assert "Key points" in style

    def test_bullets_structure(self):
        """Bullets structure should use bullet points."""
        style, _ = build_style_instructions({"structure": "bullets"}, {})
        assert "bullet" in style.lower()

    def test_paragraph_structure(self):
        """Paragraph structure should use short paragraphs."""
        style, _ = build_style_instructions({"structure": "paragraph"}, {})
        assert "paragraph" in style.lower()

    def test_examples_feature_from_preferences(self):
        """include_examples preference should add to features."""
        _, features = build_style_instructions({"include_examples": True}, {})
        assert "examples" in features

    def test_examples_feature_from_weights(self):
        """High examples weight should trigger examples feature."""
        _, features = build_style_instructions({}, {"examples": 0.6})
        assert "examples" in features

    def test_analogies_triggered_by_weight(self):
        """Analogies weight >= 0.55 should trigger analogies feature."""
        _, features = build_style_instructions({}, {"analogies": 0.6})
        assert "analogies" in features

    def test_analogies_not_triggered_by_low_weight(self):
        """Analogies weight < 0.55 should not trigger analogies."""
        _, features = build_style_instructions({}, {"analogies": 0.4})
        assert "analogies" not in features

    def test_step_by_step_triggered_by_weight(self):
        """Step-by-step weight >= 0.55 should trigger feature."""
        _, features = build_style_instructions({}, {"step_by_step": 0.6})
        assert "step_by_step" in features

    def test_mnemonic_triggered_by_weight(self):
        """Mnemonic weight >= 0.6 should trigger feature."""
        _, features = build_style_instructions({}, {"mnemonic": 0.65})
        assert "mnemonic" in features

    def test_quiz_triggered_by_weight(self):
        """Quiz weight >= 0.6 should trigger feature."""
        _, features = build_style_instructions({}, {"quiz": 0.7})
        assert "quiz" in features

    def test_language_included_in_style(self):
        """Language preference should be included in style."""
        style, _ = build_style_instructions({"language": "de"}, {})
        assert "de" in style

    def test_difficulty_auto(self):
        """Auto difficulty should adjust to user's level."""
        style, _ = build_style_instructions({"difficulty": "auto"}, {})
        assert "Adjust" in style or "implied level" in style

    def test_difficulty_specific(self):
        """Specific difficulty should be stated."""
        style, _ = build_style_instructions({"difficulty": "beginner"}, {})
        assert "beginner" in style

    def test_analogy_domain_included(self):
        """Custom analogy domain should be included when analogies enabled."""
        style, features = build_style_instructions(
            {"include_analogies": True, "analogy_domain": "sports"}, {}
        )
        assert "sports" in style
        assert "analogies" in features

    def test_examples_count(self):
        """Custom examples count should be respected."""
        style, _ = build_style_instructions(
            {"examples_per_answer": 3, "include_examples": True}, {}
        )
        assert "3" in style

    def test_none_values_handled(self):
        """None values in weights should be handled gracefully."""
        style, features = build_style_instructions(
            {}, {"examples": None, "analogies": 0.6}
        )
        assert "analogies" in features

    def test_combined_preferences_and_weights(self):
        """Complex combination of preferences and weights."""
        prefs = {
            "verbosity": "detailed",
            "structure": "sections",
            "language": "en",
            "include_examples": True,
            "step_by_step": True,
        }
        weights = {
            "examples": 0.8,
            "analogies": 0.7,
            "mnemonic": 0.65,
        }
        style, features = build_style_instructions(prefs, weights)

        assert "200-350 words" in style
        assert "examples" in features
        assert "step_by_step" in features
        assert "analogies" in features
        assert "mnemonic" in features
