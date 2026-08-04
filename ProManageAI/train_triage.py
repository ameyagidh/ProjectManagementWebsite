"""
Trains the task auto-triage model used by /triage.

Real, small, reproducible ML: TF-IDF features + a linear SVM classifier
predicting task priority (High / Medium / Low) from free-text title +
description. No pretrained weights, no network access needed at
inference time - the whole model is a few KB of vectorizer vocabulary
and SVM coefficients, joblib-dumped to model/triage_model.joblib.

Run: python train_triage.py
"""
import csv
import pathlib

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.pipeline import Pipeline

HERE = pathlib.Path(__file__).parent
CORPUS = HERE / "data" / "tasks_corpus.csv"
MODEL_OUT = HERE / "model" / "triage_model.joblib"


def load_corpus():
    texts, labels = [], []
    with open(CORPUS, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            texts.append(row["text"])
            labels.append(row["priority"])
    return texts, labels


def main():
    texts, labels = load_corpus()
    x_train, x_test, y_train, y_test = train_test_split(
        texts, labels, test_size=0.25, random_state=42, stratify=labels
    )

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1, stop_words="english")),
        ("clf", LinearSVC(class_weight="balanced", random_state=42)),
    ])
    pipeline.fit(x_train, y_train)

    preds = pipeline.predict(x_test)
    acc = accuracy_score(y_test, preds)
    print(f"Held-out accuracy: {acc:.2%}")
    print(classification_report(y_test, preds, zero_division=0))

    # Refit on the full corpus for the shipped model.
    pipeline.fit(texts, labels)

    MODEL_OUT.parent.mkdir(exist_ok=True)
    joblib.dump({"pipeline": pipeline, "holdout_accuracy": acc, "n_samples": len(texts)}, MODEL_OUT)
    print(f"Saved model to {MODEL_OUT}")


if __name__ == "__main__":
    main()
