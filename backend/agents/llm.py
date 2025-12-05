"""LangChain + Gemini helpers for the agents app."""
from __future__ import annotations

import json
import logging
from functools import lru_cache
import re
from typing import Any, Dict

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from langchain_core.messages import BaseMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger(__name__)


class GuardrailRejectedError(Exception):
    """Raised when the guardrail blocks the provided flashcard front."""

    def __init__(self, guardrail_result: Dict[str, Any]):
        super().__init__("Content blocked by guardrail")
        self.guardrail_result = guardrail_result


class FlashcardGenerationError(Exception):
    """Raised when the LLM agent fails to craft a backside."""
GUARDRAIL_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a strict safety filter for flashcards. "
            "Return JSON with keys allowed (true/false), severity (none, low, medium, high), "
            "and reasons (array of short strings). Block hate, violence, explicit sexual content, self-harm, or policy violations. "
            "If the text is safe, severity must be 'none' and reasons should be an empty list. Respond with JSON only.",
        ),
        (
            "human",
            "Frontside text to evaluate:\n```{front}```",
        ),
    ]
)

FLASHCARD_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You generate concise yet informative flashcard backs for spaced repetition. "
            "Address the prompt directly, highlight the key answer, and include mnemonics or memory hooks when helpful. "
            "Format the entire response as clean Markdown (e.g., bold key terms, bullet lists, short code fences when needed) so it renders well on the frontend.",
        ),
        (
            "human",
            "Flashcard front:\n{front}\nRespond with the finalized backside text only.",
        ),
    ]
)


@lru_cache(maxsize=1)
def get_base_llm() -> ChatGoogleGenerativeAI:
    api_key = getattr(settings, "GEMINI_API_KEY", "")
    if not api_key:
        raise ImproperlyConfigured("GEMINI_API_KEY is not configured. Add it to your .env file.")

    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.3,
        convert_system_message_to_human=True,
        google_api_key=api_key,
    )


def _guardrail_chain_input(front: str) -> Dict[str, str]:
    return {"front": front.strip()}


def _coerce_guardrail_response(raw_response: Any) -> Dict[str, Any]:
    if isinstance(raw_response, BaseMessage):
        content = raw_response.content
        if isinstance(content, list):
            text = "".join(part.get("text", "") for part in content if isinstance(part, dict))
        else:
            text = str(content)
    else:
        text = str(raw_response)

    # LangChain models may wrap JSON in ```json ``` fences; strip them before parsing.
    fenced_json = re.search(r"```json\s*(.*?)\s*```", text, flags=re.DOTALL)
    if fenced_json:
        text = fenced_json.group(1)

    default_payload = {
        "allowed": False,
        "severity": "unknown",
        "reasons": ["Guardrail returned an invalid response."],
        "raw": text,
    }

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        logger.warning("Failed to parse guardrail response as JSON: %s", text)
        return default_payload

    allowed = bool(parsed.get("allowed"))
    severity = str(parsed.get("severity", "none"))
    reasons = parsed.get("reasons", [])
    if not isinstance(reasons, list):
        reasons = [str(reasons)]

    return {
        "allowed": allowed,
        "severity": severity,
        "reasons": [str(item) for item in reasons],
        "raw": text,
    }


def _message_to_text(message: Any) -> str:
    """Extract text content from LangChain message/response."""
    if isinstance(message, BaseMessage):
        content = message.content
        if isinstance(content, list):
            return "".join(part.get("text", "") for part in content if isinstance(part, dict))
        return str(content)
    return str(message)


def run_guardrail(front: str) -> Dict[str, Any]:
    llm = get_base_llm()
    chain = GUARDRAIL_PROMPT | llm
    response = chain.invoke(_guardrail_chain_input(front))
    return _coerce_guardrail_response(response)


def _run_agent(front: str) -> str:
    llm = get_base_llm()
    chain = FLASHCARD_PROMPT | llm
    try:
        result = chain.invoke({"front": front})
    except Exception as exc:  # pragma: no cover - relies on external service
        logger.exception("LangChain agent failed to generate backside.")
        raise FlashcardGenerationError("LLM agent execution failed") from exc

    output = _message_to_text(result)

    if not output:
        raise FlashcardGenerationError("LLM agent returned empty output")

    return output.strip()


def generate_flashcard_backside(front: str) -> Dict[str, Any]:
    normalized_front = front.strip()
    guardrail_result = run_guardrail(normalized_front)
    if not guardrail_result.get("allowed"):
        raise GuardrailRejectedError(guardrail_result)

    backside = _run_agent(normalized_front)
    return {
        "front": normalized_front,
        "back": backside,
        "guardrail": guardrail_result,
    }
