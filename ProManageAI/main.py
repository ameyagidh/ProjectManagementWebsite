"""
ProManageAI - lightweight AI microservice for ProManage.

Endpoints:
  GET  /health            - liveness + model metadata
  POST /triage             - predicts task priority (High/Medium/Low) from
                              title + description using a locally trained
                              TF-IDF + LinearSVC model (model/triage_model.joblib).
                              No network access or API key required.
  POST /summarize           - standup-style summary of recent activity logs.
                              Uses an LLM via LangChain when an API key is
                              configured (LLM_PROVIDER/ANTHROPIC_API_KEY /
                              OPENAI_API_KEY); otherwise falls back to a
                              deterministic extractive summarizer so the
                              endpoint always returns something real.

Run: uvicorn main:app --reload --port 8001
"""
import pathlib
from typing import List, Optional

import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from summarizer import summarize_extractive, summarize_with_llm, llm_available

HERE = pathlib.Path(__file__).parent
MODEL_PATH = HERE / "model" / "triage_model.joblib"

app = FastAPI(title="ProManageAI", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_model_bundle = None


def get_model():
    global _model_bundle
    if _model_bundle is None:
        _model_bundle = joblib.load(MODEL_PATH)
    return _model_bundle


class TriageRequest(BaseModel):
    title: str
    description: Optional[str] = ""


class TriageResponse(BaseModel):
    priority: str
    confidence_rank: List[str]
    model: str
    holdout_accuracy: float


class SummarizeRequest(BaseModel):
    logs: List[str]


class SummarizeResponse(BaseModel):
    summary: str
    method: str


@app.get("/health")
def health():
    bundle = get_model()
    return {
        "status": "ok",
        "model": "tfidf+linear_svc",
        "training_samples": bundle["n_samples"],
        "holdout_accuracy": bundle["holdout_accuracy"],
        "llm_available": llm_available(),
    }


@app.post("/triage", response_model=TriageResponse)
def triage(req: TriageRequest):
    bundle = get_model()
    pipeline = bundle["pipeline"]
    text = f"{req.title}. {req.description or ''}".strip()

    decision = pipeline.decision_function([text])[0]
    classes = pipeline.classes_
    ranked = [c for _, c in sorted(zip(decision, classes), reverse=True)]

    return TriageResponse(
        priority=ranked[0],
        confidence_rank=ranked,
        model="tfidf+linear_svc",
        holdout_accuracy=bundle["holdout_accuracy"],
    )


@app.post("/summarize", response_model=SummarizeResponse)
def summarize(req: SummarizeRequest):
    if llm_available():
        return SummarizeResponse(summary=summarize_with_llm(req.logs), method="langchain-llm")
    return SummarizeResponse(summary=summarize_extractive(req.logs), method="extractive-textrank")
