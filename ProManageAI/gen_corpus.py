"""
Generates a larger, more balanced synthetic-but-realistic labelled corpus
for the task-triage classifier by combining templates with subjects.
Deterministic (no random/time calls) so it's reproducible.
"""
import csv
import pathlib
import itertools

HERE = pathlib.Path(__file__).parent
OUT = HERE / "data" / "tasks_corpus.csv"

HIGH_TEMPLATES = [
    "Production {subject} is down for all users",
    "Critical outage: {subject} returning 500 errors",
    "Security issue: {subject} exposes user data",
    "Data loss bug in {subject} after refresh",
    "{subject} crashes the server under load",
    "Users cannot complete {subject} at all since deploy",
    "Payment failure in {subject}, customers affected",
    "Memory leak in {subject} crashes app after hours",
    "Race condition corrupts {subject} during concurrent use",
    "Auth bypass discovered in {subject}",
    "{subject} completely unresponsive in production",
    "Urgent: {subject} blocking all customer signups",
]
HIGH_SUBJECTS = [
    "login endpoint", "file upload", "database connection pool", "payment webhook",
    "websocket server", "task drag-and-drop", "session handling", "checkout flow",
    "signup form", "JWT validation", "email notification service", "room join logic",
]

MEDIUM_TEMPLATES = [
    "Add {subject} to the app",
    "Improve {subject} for better usability",
    "Refactor {subject} into a cleaner module",
    "Support {subject} across more screens",
    "Migrate {subject} to the new design system",
    "Add tests for {subject}",
    "Improve performance of {subject}",
    "Add pagination to {subject}",
    "Improve error handling in {subject}",
    "Add filtering options to {subject}",
]
MEDIUM_SUBJECTS = [
    "dark mode toggle", "kanban board loading state", "task search", "chat notifications",
    "mobile navbar", "project list", "profile avatar upload", "socket event handlers",
    "signup validation", "room creation flow", "drag reordering", "markdown chat rendering",
]

LOW_TEMPLATES = [
    "Fix typo in {subject}",
    "Update {subject} documentation",
    "Clean up unused code in {subject}",
    "Rename variable in {subject} for clarity",
    "Add tooltip to {subject}",
    "Improve spacing on {subject}",
    "Consider adding animation to {subject}",
    "Nice to have: better font for {subject}",
    "Update changelog for {subject}",
    "Explore alternative icon set for {subject}",
]
LOW_SUBJECTS = [
    "login page", "README", "Main.js component", "add room button", "navbar",
    "settings page", "task card", "footer", "loading spinner", "empty state message",
]


def build(templates, subjects, label, rows):
    for t, s in itertools.product(templates, subjects):
        rows.append((t.format(subject=s), label))


def main():
    rows = []
    build(HIGH_TEMPLATES, HIGH_SUBJECTS, "High", rows)
    build(MEDIUM_TEMPLATES, MEDIUM_SUBJECTS, "Medium", rows)
    build(LOW_TEMPLATES, LOW_SUBJECTS, "Low", rows)

    with open(OUT, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["text", "priority"])
        w.writerows(rows)

    print(f"Wrote {len(rows)} rows to {OUT}")


if __name__ == "__main__":
    main()
