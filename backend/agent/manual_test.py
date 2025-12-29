#!/usr/bin/env python
"""
Manual Testing Script for the Agent Module.

This script allows you to interactively test the agent components
and verify everything works correctly before running automated tests.

Usage:
    cd backend
    python -m agent.manual_test

Or in Django shell:
    python manage.py shell
    exec(open('agent/manual_test.py').read())
"""

import os
import sys
import time
import json
from pathlib import Path

# Setup Django
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend_project.settings")

import django

django.setup()

from django.conf import settings
from django.contrib.auth.models import User
from langchain_core.messages import HumanMessage

from cards.models import Deck
from accounts.models import UserProfile
from agent.state import AgentState
from agent.prompting import build_style_instructions


def print_header(title: str):
    """Print a formatted header."""
    print("\n" + "=" * 60)
    print(f" {title}")
    print("=" * 60)


def print_result(label: str, value, success: bool = True):
    """Print a result with status indicator."""
    status = "✓" if success else "✗"
    print(f"  {status} {label}: {value}")


def check_environment():
    """Check if all required environment variables are set."""
    print_header("ENVIRONMENT CHECK")

    checks = {
        "GEMINI_API_KEY": bool(settings.GEMINI_API_KEY),
        "TAVILY_API_KEY": bool(getattr(settings, "TAVILY_API_KEY", "")),
        "SUPABASE_URL": bool(getattr(settings, "SUPABASE_URL", "")),
        "SUPABASE_KEY": bool(getattr(settings, "SUPABASE_KEY", "")),
    }

    all_ok = True
    for key, present in checks.items():
        print_result(key, "configured" if present else "MISSING", present)
        if not present and key in ["GEMINI_API_KEY"]:
            all_ok = False

    return all_ok


def test_prompting():
    """Test the prompting module."""
    print_header("PROMPTING MODULE TEST")

    try:
        # Test 1: Default preferences
        style, features = build_style_instructions({}, {})
        print_result("Default style generated", f"{len(style)} chars")

        # Test 2: Custom preferences
        prefs = {
            "verbosity": "detailed",
            "structure": "sections",
            "include_examples": True,
            "include_analogies": True,
        }
        weights = {"examples": 0.8, "analogies": 0.7}
        style, features = build_style_instructions(prefs, weights)
        print_result("Custom style features", features)

        # Test 3: Performance
        start = time.time()
        for _ in range(100):
            build_style_instructions(prefs, weights)
        elapsed = (time.time() - start) * 1000
        print_result("100 builds time", f"{elapsed:.2f}ms")

        return True
    except Exception as e:
        print_result("Error", str(e), False)
        return False


def test_llm_connection():
    """Test connection to Gemini LLM."""
    print_header("LLM CONNECTION TEST")

    try:
        from agent.llm_graph import llm

        start = time.time()
        response = llm.invoke("Say 'Hello, I am working!' in exactly those words.")
        elapsed = time.time() - start

        content = response.content if hasattr(response, "content") else str(response)
        print_result("Response received", f"{len(content)} chars in {elapsed:.2f}s")
        print(f"\n  Response: {content[:200]}...")

        return True
    except Exception as e:
        print_result("LLM Error", str(e), False)
        return False


def test_llm_with_tools():
    """Test LLM with tools bound."""
    print_header("LLM WITH TOOLS TEST")

    try:
        from agent.llm_graph import llm_with_tools
        from langchain_core.messages import SystemMessage, HumanMessage

        messages = [
            SystemMessage(
                content="You are a helpful assistant. You have access to search tools."
            ),
            HumanMessage(
                content="What is the definition of 'photosynthesis'? You can use your knowledge."
            ),
        ]

        start = time.time()
        response = llm_with_tools.invoke(messages)
        elapsed = time.time() - start

        has_tool_calls = bool(getattr(response, "tool_calls", None))
        content = response.content if hasattr(response, "content") else ""

        print_result("Response time", f"{elapsed:.2f}s")
        print_result("Has tool calls", has_tool_calls)
        print_result("Content length", f"{len(content)} chars")

        if content:
            print(f"\n  Response preview: {content[:300]}...")
        if has_tool_calls:
            print(f"\n  Tool calls: {response.tool_calls}")

        return True
    except Exception as e:
        print_result("Error", str(e), False)
        return False


def test_tavily_search():
    """Test Tavily web search."""
    print_header("TAVILY SEARCH TEST")

    if not getattr(settings, "TAVILY_API_KEY", ""):
        print_result("Skipped", "TAVILY_API_KEY not configured", False)
        return False

    try:
        from agent.tools import web_search_tool

        start = time.time()
        result = web_search_tool.invoke(
            {"query": "what is machine learning definition"}
        )
        elapsed = time.time() - start

        print_result("Search time", f"{elapsed:.2f}s")
        print_result("Results received", f"{len(str(result))} chars")

        return True
    except Exception as e:
        print_result("Error", str(e), False)
        return False


def test_rag_pipeline():
    """Test the RAG pipeline with Supabase."""
    print_header("RAG PIPELINE TEST")

    if not (
        getattr(settings, "SUPABASE_URL", "") and getattr(settings, "SUPABASE_KEY", "")
    ):
        print_result("Skipped", "Supabase not configured", False)
        return False

    try:
        from agent.tools import search_deck_documents
        from uploads.services.document_ingestion import (
            _build_embedding_model,
            _build_supabase_client,
        )

        # Test embedding model
        embeddings = _build_embedding_model()
        print_result("Embedding model", "initialized")

        # Test Supabase client
        client = _build_supabase_client()
        print_result("Supabase client", "connected")

        # Test vector search (will return empty for non-existent deck)
        start = time.time()
        result = search_deck_documents.invoke({"query": "test query", "deck_id": 99999})
        elapsed = time.time() - start

        print_result("Vector search time", f"{elapsed:.2f}s")
        print_result(
            "Results",
            "empty (expected for non-existent deck)"
            if not result
            else f"{len(result)} chars",
        )

        return True
    except Exception as e:
        print_result("Error", str(e), False)
        return False


def test_guardrail():
    """Test the safety guardrail."""
    print_header("GUARDRAIL TEST")

    try:
        from agent.llm_graph import guardrail_node

        # Test safe content
        safe_state = {"front": "What is photosynthesis?", "messages": []}

        start = time.time()
        result = guardrail_node(safe_state)
        elapsed = time.time() - start

        print_result(
            "Safe content check",
            f"is_safe={result.get('is_safe')}, time={elapsed:.2f}s",
        )

        return result.get("is_safe", False)
    except Exception as e:
        print_result("Error", str(e), False)
        return False


def test_full_pipeline():
    """Test the complete agent pipeline."""
    print_header("FULL PIPELINE TEST")

    try:
        from agent.llm_graph import app

        # Create or get test user and deck
        user, _ = User.objects.get_or_create(
            username="manual_test_user", defaults={"password": "test123"}
        )
        deck, _ = Deck.objects.get_or_create(user=user, name="Manual Test Deck")

        # Ensure user has a profile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.preferences = {"verbosity": "concise", "include_examples": True}
        profile.save()

        # Create initial state
        initial_state: AgentState = {
            "messages": [HumanMessage(content="What is DNA?")],
            "front": "What is DNA?",
            "deck_id": deck.id,
            "user_id": user.id,
            "critique_count": 0,
            "is_safe": True,
            "safety_reason": "",
            "draft_answer": "",
            "user_preferences": {},
            "user_weights": {},
            "deck_context": "",
            "style_instructions": "",
            "features_used": [],
            "generation_meta": {},
            "final_json": {},
        }

        print("  Starting pipeline...")
        start = time.time()
        final_state = app.invoke(initial_state)
        elapsed = time.time() - start

        print_result("Pipeline completed", f"{elapsed:.2f}s")
        print_result("Is safe", final_state.get("is_safe"))
        print_result("RAG used", final_state.get("generation_meta", {}).get("rag_used"))
        print_result("Features used", final_state.get("features_used"))

        if final_state.get("final_json"):
            back = final_state["final_json"].get("back", "")
            print(f"\n  Generated answer ({len(back)} chars):")
            print(f"  {back[:500]}...")

        return final_state.get("is_safe", False) and final_state.get(
            "final_json", {}
        ).get("back")
    except Exception as e:
        print_result("Error", str(e), False)
        import traceback

        traceback.print_exc()
        return False


def test_api_endpoint():
    """Test the API endpoint with a real HTTP request."""
    print_header("API ENDPOINT TEST")

    try:
        from rest_framework.test import APIClient
        from rest_framework_simplejwt.tokens import RefreshToken

        # Create or get test user
        user, _ = User.objects.get_or_create(
            username="api_test_user", defaults={"password": "test123"}
        )
        deck, _ = Deck.objects.get_or_create(user=user, name="API Test Deck")

        # Create authenticated client
        client = APIClient()
        client.force_authenticate(user=user)

        # Test the rapid endpoint (faster)
        print("  Testing rapid endpoint...")
        start = time.time()
        response = client.post(
            "/api/agent/flashcard/rapid/backside",
            {"front": "What is a variable in programming?"},
            format="json",
        )
        elapsed = time.time() - start

        print_result("Rapid endpoint status", response.status_code)
        print_result("Response time", f"{elapsed:.2f}s")

        if response.status_code == 200:
            print(f"  Response: {json.dumps(response.data, indent=2)[:500]}...")
        else:
            print(f"  Error: {response.data}")

        # Test the full endpoint
        print("\n  Testing full endpoint...")
        start = time.time()
        response = client.post(
            "/api/agent/flashcard/backside/",
            {"front": "What is a function?", "deck_id": deck.id},
            format="json",
        )
        elapsed = time.time() - start

        print_result("Full endpoint status", response.status_code)
        print_result("Response time", f"{elapsed:.2f}s")

        if response.status_code == 200:
            print(f"  Response: {json.dumps(response.data, indent=2)[:500]}...")
        else:
            print(f"  Error: {response.data}")

        return response.status_code == 200
    except Exception as e:
        print_result("Error", str(e), False)
        import traceback

        traceback.print_exc()
        return False


def run_all_tests():
    """Run all manual tests."""
    print("\n" + "🧪 " * 20)
    print("     AGENT MANUAL TESTING SUITE")
    print("🧪 " * 20)

    results = {}

    # Run tests
    results["Environment"] = check_environment()
    results["Prompting"] = test_prompting()
    results["LLM Connection"] = test_llm_connection()
    results["LLM with Tools"] = test_llm_with_tools()
    results["Tavily Search"] = test_tavily_search()
    results["RAG Pipeline"] = test_rag_pipeline()
    results["Guardrail"] = test_guardrail()
    results["Full Pipeline"] = test_full_pipeline()
    results["API Endpoint"] = test_api_endpoint()

    # Summary
    print_header("TEST SUMMARY")
    passed = 0
    failed = 0
    for name, success in results.items():
        if success:
            print(f"  ✓ {name}")
            passed += 1
        else:
            print(f"  ✗ {name}")
            failed += 1

    print(f"\n  Total: {passed} passed, {failed} failed")
    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
