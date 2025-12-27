from django.test import TestCase
from .prompting import build_style_instructions


class PromptingTests(TestCase):
    def test_style_instructions_include_examples(self):
        prefs = {"include_examples": True, "examples_per_answer": 2, "structure": "sections", "verbosity": "balanced"}
        weights = {"examples": 0.2}  # prefs force it anyway
        style, features = build_style_instructions(prefs, weights)

        self.assertIn("Include 2 concrete example", style)
        self.assertIn("Use this structure", style)
        self.assertIn("examples", features)
