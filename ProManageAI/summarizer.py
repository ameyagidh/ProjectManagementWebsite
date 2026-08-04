"""
Provider-gated standup summarizer.

If LLM_PROVIDER + an API key is set, uses LangChain to call the configured
LLM. Otherwise (the default on a machine with no key) falls back to a
dependency-light extractive summarizer: score sentences by term frequency
overlap with the whole log (a simplified TextRank/LexRank idea) and return
the top-scoring lines. This path requires no network access and always
returns a real result, which is what should be screenshotted/demoed.
"""
import os
import re
from collections import Counter
from typing import List


def llm_available() -> bool:
    provider = os.getenv("LLM_PROVIDER", "").lower()
    if provider == "anthropic":
        return bool(os.getenv("ANTHROPIC_API_KEY"))
    if provider == "openai":
        return bool(os.getenv("OPENAI_API_KEY"))
    return False


def summarize_with_llm(logs: List[str]) -> str:
    """LangChain path - only reached when llm_available() is True."""
    from langchain_core.prompts import ChatPromptTemplate

    provider = os.getenv("LLM_PROVIDER", "").lower()
    if provider == "anthropic":
        from langchain_anthropic import ChatAnthropic
        llm = ChatAnthropic(model="claude-3-5-haiku-latest")
    else:
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(model="gpt-4o-mini")

    prompt = ChatPromptTemplate.from_messages([
        ("system", "You write a concise 3-4 sentence standup summary from a list of project activity log lines."),
        ("human", "{logs}"),
    ])
    chain = prompt | llm
    result = chain.invoke({"logs": "\n".join(logs)})
    return result.content


_STOPWORDS = set(
    "a an the of to in on at for and or is are was were be been being with "
    "this that these those it its from by as has have had will would could "
    "should".split()
)


def _tokenize(line: str) -> List[str]:
    return [w for w in re.findall(r"[a-zA-Z']+", line.lower()) if w not in _STOPWORDS]


def summarize_extractive(logs: List[str], top_n: int = 3) -> str:
    """
    Deterministic, dependency-free extractive summary: score each log line
    by the frequency of its words across the whole log set (words that
    recur across many activity entries are treated as more "central" to
    the sprint), then return the top-N highest scoring, original-order lines.
    """
    if not logs:
        return "No recent activity to summarize."

    word_freq = Counter()
    for line in logs:
        word_freq.update(set(_tokenize(line)))

    scored = []
    for idx, line in enumerate(logs):
        tokens = _tokenize(line)
        score = sum(word_freq[t] for t in tokens) / (len(tokens) or 1)
        scored.append((score, idx, line))

    top = sorted(scored, reverse=True)[:top_n]
    top_in_order = [line for _, _, line in sorted(top, key=lambda x: x[1])]
    return " ".join(top_in_order)
