# ProManageAI

Lightweight FastAPI microservice providing AI features for ProManage:

- `POST /triage` - task priority prediction (TF-IDF + LinearSVC, trained locally,
  no API key or network access needed).
- `POST /summarize` - standup-style summary of activity logs; extractive by default,
  LangChain + Claude/GPT if `LLM_PROVIDER` and an API key are configured.
- `GET /health` - model metadata (training set size, held-out accuracy, whether an
  LLM provider is configured).

## Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi "uvicorn[standard]" scikit-learn joblib
python train_triage.py      # regenerate model/triage_model.joblib (already checked in)
uvicorn main:app --reload --port 8001
```

To enable the LangChain summarization path:

```bash
pip install langchain-core langchain-anthropic   # or langchain-openai
export LLM_PROVIDER=anthropic
export ANTHROPIC_API_KEY=sk-...
```

## Regenerating the training corpus

`gen_corpus.py` writes `data/tasks_corpus.csv` from a small template x subject grid
across three priority classes. Edit the templates/subjects there, rerun it, then rerun
`train_triage.py`. See `../docs/TECHNICAL.md` for a discussion of what the reported
accuracy does and doesn't mean.
