"""
Performance Benchmarking for the Agent Module.

This script measures execution time and resource usage of various
agent components to identify bottlenecks and optimization opportunities.

Usage:
    cd backend
    python -m agent.benchmark
"""
import os
import sys
import time
import statistics
from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict, Any

# Setup Django
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend_project.settings')

import django
django.setup()

from django.conf import settings
from langchain_core.messages import HumanMessage


@dataclass
class BenchmarkResult:
    name: str
    times: List[float]
    
    @property
    def mean(self) -> float:
        return statistics.mean(self.times)
    
    @property
    def median(self) -> float:
        return statistics.median(self.times)
    
    @property
    def std_dev(self) -> float:
        return statistics.stdev(self.times) if len(self.times) > 1 else 0
    
    @property
    def min(self) -> float:
        return min(self.times)
    
    @property
    def max(self) -> float:
        return max(self.times)


def benchmark(func, name: str, iterations: int = 5, warmup: int = 1) -> BenchmarkResult:
    """Run a benchmark with warmup and multiple iterations."""
    # Warmup
    for _ in range(warmup):
        try:
            func()
        except Exception:
            pass
    
    # Actual benchmark
    times = []
    for i in range(iterations):
        start = time.perf_counter()
        try:
            func()
            elapsed = time.perf_counter() - start
            times.append(elapsed)
            print(f"  Run {i+1}/{iterations}: {elapsed:.3f}s")
        except Exception as e:
            print(f"  Run {i+1}/{iterations}: ERROR - {e}")
            times.append(float('inf'))
    
    return BenchmarkResult(name=name, times=[t for t in times if t != float('inf')])


def print_result(result: BenchmarkResult):
    """Print benchmark results."""
    if not result.times:
        print(f"\n{result.name}: No successful runs")
        return
        
    print(f"\n{result.name}:")
    print(f"  Mean:   {result.mean:.3f}s")
    print(f"  Median: {result.median:.3f}s")
    print(f"  Min:    {result.min:.3f}s")
    print(f"  Max:    {result.max:.3f}s")
    if result.std_dev:
        print(f"  StdDev: {result.std_dev:.3f}s")


def benchmark_prompting():
    """Benchmark prompt building."""
    from agent.prompting import build_style_instructions
    
    prefs = {
        "verbosity": "detailed",
        "structure": "sections",
        "include_examples": True,
        "include_analogies": True,
    }
    weights = {"examples": 0.8, "analogies": 0.7}
    
    def run():
        for _ in range(1000):
            build_style_instructions(prefs, weights)
    
    return benchmark(run, "Prompt Building (1000x)", iterations=5)


def benchmark_llm_simple():
    """Benchmark simple LLM call."""
    from agent.llm_graph import llm
    
    def run():
        llm.invoke("Define: variable. Be brief.")
    
    return benchmark(run, "Simple LLM Call", iterations=3)


def benchmark_llm_with_tools():
    """Benchmark LLM with tools."""
    from agent.llm_graph import llm_with_tools
    from langchain_core.messages import SystemMessage, HumanMessage
    
    messages = [
        SystemMessage(content="You are a helpful assistant."),
        HumanMessage(content="What is photosynthesis? Answer briefly.")
    ]
    
    def run():
        llm_with_tools.invoke(messages)
    
    return benchmark(run, "LLM with Tools", iterations=3)


def benchmark_guardrail():
    """Benchmark guardrail check."""
    from agent.llm_graph import guardrail_node
    
    state = {"front": "What is photosynthesis?", "messages": []}
    
    def run():
        guardrail_node(state)
    
    return benchmark(run, "Guardrail Check", iterations=3)


def benchmark_full_pipeline():
    """Benchmark full agent pipeline."""
    from agent.llm_graph import app
    from agent.state import AgentState
    from django.contrib.auth.models import User
    from cards.models import Deck
    
    user, _ = User.objects.get_or_create(
        username='benchmark_user',
        defaults={'password': 'test123'}
    )
    deck, _ = Deck.objects.get_or_create(
        user=user,
        name="Benchmark Deck"
    )
    
    def run():
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
            "final_json": {}
        }
        app.invoke(initial_state)
    
    return benchmark(run, "Full Pipeline", iterations=3)


def run_benchmarks():
    """Run all benchmarks."""
    print("=" * 60)
    print("       AGENT PERFORMANCE BENCHMARKS")
    print("=" * 60)
    
    results = []
    
    # CPU-bound benchmarks
    print("\n[CPU-Bound Benchmarks]")
    results.append(benchmark_prompting())
    
    # Check if API keys are configured
    if not settings.GEMINI_API_KEY:
        print("\n⚠️  GEMINI_API_KEY not configured. Skipping LLM benchmarks.")
        return
    
    # API-bound benchmarks
    print("\n[API-Bound Benchmarks]")
    results.append(benchmark_llm_simple())
    results.append(benchmark_llm_with_tools())
    results.append(benchmark_guardrail())
    results.append(benchmark_full_pipeline())
    
    # Print summary
    print("\n" + "=" * 60)
    print("       BENCHMARK SUMMARY")
    print("=" * 60)
    
    for result in results:
        print_result(result)
    
    # Performance recommendations
    print("\n" + "=" * 60)
    print("       PERFORMANCE RECOMMENDATIONS")
    print("=" * 60)
    
    for result in results:
        if result.times and result.mean > 5:
            print(f"\n⚠️  {result.name} is slow ({result.mean:.2f}s avg)")
            if "Pipeline" in result.name:
                print("   Consider: Caching, parallel tool calls, or simpler prompts")
            elif "LLM" in result.name:
                print("   Consider: Using a faster model or caching responses")


if __name__ == "__main__":
    run_benchmarks()
