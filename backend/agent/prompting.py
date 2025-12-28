from __future__ import annotations

from typing import Any, Dict, List, Tuple


def build_style_instructions(
    preferences: Dict[str, Any], weights: Dict[str, Any]
) -> Tuple[str, List[str]]:
    """
    Deterministic, safe prompt builder:
    we don't let the LLM invent arbitrary rules. We render from known keys.
    """
    prefs = preferences or {}
    w = {k: float(v) for k, v in (weights or {}).items() if v is not None}

    features_used: List[str] = []

    verbosity = prefs.get("verbosity", "balanced")
    structure = prefs.get("structure", "sections")
    language = prefs.get("language", "en")
    difficulty = prefs.get("difficulty", "auto")

    include_examples = bool(prefs.get("include_examples", True)) or (
        w.get("examples", 0.5) >= 0.5
    )
    include_analogies = bool(prefs.get("include_analogies", False)) or (
        w.get("analogies", 0.5) >= 0.55
    )
    step_by_step = bool(prefs.get("step_by_step", True)) or (
        w.get("step_by_step", 0.5) >= 0.55
    )
    include_mnemonic = bool(prefs.get("include_mnemonic", False)) or (
        w.get("mnemonic", 0.5) >= 0.6
    )
    quiz_at_end = bool(prefs.get("quiz_at_end", False)) or (w.get("quiz", 0.5) >= 0.6)

    if include_examples:
        features_used.append("examples")
    if include_analogies:
        features_used.append("analogies")
    if step_by_step:
        features_used.append("step_by_step")
    if include_mnemonic:
        features_used.append("mnemonic")
    if quiz_at_end:
        features_used.append("quiz")

    analogy_domain = prefs.get("analogy_domain", "coding")
    examples_n = int(prefs.get("examples_per_answer", 1) or 1)

    # Structure policy
    if structure == "sections":
        structure_text = (
            "Use this structure:\n"
            "1) Definition (1-2 lines)\n"
            "2) Key points (3-6 bullets)\n"
            "3) Example\n"
            "4) Common mistakes / pitfalls (optional)\n"
        )
    elif structure == "bullets":
        structure_text = (
            "Answer mainly as bullet points with a short definition at the top."
        )
    else:
        structure_text = "Answer as a short paragraph, then a compact bullet summary."

    # Verbosity policy
    if verbosity == "concise":
        length_text = "Keep it concise (max ~120 words)."
    elif verbosity == "detailed":
        length_text = "Be detailed but focused (~200-350 words)."
    else:
        length_text = "Keep it balanced (~150-220 words)."

    # Difficulty policy
    if difficulty != "auto":
        difficulty_text = f"Target level: {difficulty}."
    else:
        difficulty_text = "Adjust difficulty to the user's implied level."

    # Examples / analogies policies
    extras = []
    if include_examples:
        extras.append(f"Include {examples_n} concrete example(s).")
    if include_analogies:
        extras.append(f"Include 1 short analogy using the domain: {analogy_domain}.")
    if step_by_step:
        extras.append("When explaining a process, use step-by-step sequencing.")
    if include_mnemonic:
        extras.append("If appropriate, add a short mnemonic to remember the concept.")
    if quiz_at_end:
        extras.append("End with 1 quick self-check question.")

    style = (
        f"Language: {language}\n"
        f"{length_text}\n"
        f"{difficulty_text}\n"
        f"{structure_text}\n" + ("\n".join(f"- {x}" for x in extras) if extras else "")
    ).strip()

    return style, features_used
