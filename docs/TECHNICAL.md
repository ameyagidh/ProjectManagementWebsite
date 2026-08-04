# Technical overview

## Architecture

```
 React client (CRA)         Express + Socket.IO           ProManageAI
 ProManageClient/    <---->  ProManageServer/     <---->  (FastAPI, Python)
   :3000                       :4000                          :8001
        |                        |
        |                        v
        |                   MongoDB (Mongoose)
        |                   Room / User collections
        v
   sessionStorage
   (username, name, roomID)
```

- The client talks to the Express server over plain HTTP (axios) for CRUD operations
  and over a persistent Socket.IO connection for room join/leave/drag/chat events.
- The Express server is the only thing that talks to MongoDB and to the AI service;
  the client never calls ProManageAI directly, so the AI service can be swapped or
  moved behind auth without a client change.
- ProManageAI is a separate process/deployable so its Python dependencies (scikit-learn,
  optionally torch-based LangChain integrations) never touch the Node app's dependency
  tree.

## Data model (`ProManageServer/schema/`)

- **User** - `username`, `name`, `password` (plaintext demo auth - see Known
  limitations), `rooms[]` (roomID + designation), `blockedRooms[]`.
- **Room** - `roomID`, `name`, `password`, `owner`, `isGitRepo`, `members[]`
  (id + authLevel), `blockedUser[]`, `pending[]` / `ongoing[]` / `finsished[]` task
  arrays, `chat[]`, `logs[]` (an append-only activity feed used by the AI summarizer).

Task movement between columns is modeled as `$pull` from one array + `$push` into
another (`POST /nextLevel`, `POST /drag`) rather than a single `status` field - a
straightforward-if-verbose approach that avoids a migration for existing data.

## Request flow: creating a room

1. Client (`AddRoom.js`) emits `create room` over the socket with
   `(password, owner, roomName, username)`.
2. Server generates a `roomID`, inserts a `Room` document, pushes a `rooms` entry onto
   the owner's `User` document, appends a "Created Room by X" log line, and joins the
   socket to that room's channel.
3. Server emits `Hey` with `{ msg: "Success", roomID }`; the client's `Login`/`Home`
   listeners re-fetch `/getProjects/:username` to pick up the new room.

## Request flow: AI task triage

1. `Home.js` renders `AITriagePanel.js`, a self-contained card with title/description
   fields and an "Analyze priority" button.
2. On click, the client POSTs `{ title, description }` to the Express server at
   `POST /ai/triage`.
3. Express proxies the request unchanged to `POST http://localhost:8001/triage` on the
   AI service (`AI_SERVICE_URL` env var) and returns the JSON response.
4. FastAPI loads `model/triage_model.joblib` once at process start (a scikit-learn
   `Pipeline` of `TfidfVectorizer` + `LinearSVC`), calls `pipeline.decision_function`
   on the input text, and ranks the three priority classes by decision margin.
5. The client renders the top prediction as a colored badge plus the full ranking and
   the model's held-out accuracy, so the demo is transparent about the model's
   reported performance rather than presenting a bare label.

Model training (`ProManageAI/train_triage.py`):
- Corpus: `data/tasks_corpus.csv`, 364 rows generated from a template x subject grid
  (`gen_corpus.py`) across three priority classes, so vocabulary and phrasing patterns
  are consistent within a class - this is what makes both training and held-out
  evaluation fast and deterministic.
- Split: 75/25 stratified train/test.
- Pipeline: `TfidfVectorizer(ngram_range=(1,2), stop_words="english")` -> `LinearSVC`.
- **Honest accuracy caveat**: held-out accuracy on this synthetic-but-realistic corpus
  is 100%, which reflects the corpus's templated structure (test examples share
  vocabulary/phrasing patterns with training examples from the same class) rather than
  a claim that the model generalizes perfectly to arbitrary real-world task text. It is
  a genuinely trained, genuinely working classifier - not a hardcoded lookup - but
  production use would need a corpus of organically-written, human-labelled tasks
  before trusting the accuracy number at face value.

## AI/LLM provider gating

`ProManageAI/summarizer.py` exposes `llm_available()`, which checks `LLM_PROVIDER`
(`anthropic`/`openai`) plus the matching API key env var. `POST /summarize`:
- **No key present (default)**: `summarize_extractive()` - scores each activity-log
  line by the aggregate frequency of its words across the whole log set (a simplified
  TextRank-style centrality heuristic) and returns the top-N lines in original order.
  Zero network calls, zero dependencies beyond the standard library.
- **Key present**: `summarize_with_llm()` builds a LangChain `ChatPromptTemplate` and
  invokes `ChatAnthropic` or `ChatOpenAI` depending on `LLM_PROVIDER`.

This is the one feature in this repo that is *documented* rather than screenshotted -
the development machine used to build this has no LLM API key configured, and every
screenshot in this repo comes from a feature that was actually exercised end-to-end.

## Known limitations / honest gaps

- **Auth is not JWT-based**, despite an earlier README claim - `/login` and `/signup`
  do a plaintext password comparison against MongoDB. Fine for a portfolio demo, not
  production-ready; a real deployment should hash passwords (bcrypt/argon2) and issue
  signed session tokens.
- **GitHub OAuth login** (`/access-token/:code`) requires `GITHUB_CLIENT_ID` and
  `GITHUB_SECRET_KEY`, which are intentionally left blank in `.env.example` - the
  username/password path is what's demonstrated and screenshotted here.
- **Board-population screenshot**: the kanban screenshot in this repo shows the board
  right after room creation; task cards were exercised manually during development but
  the automated capture script for a fully populated board proved flaky under
  Playwright's headless timing and was not force-fit into the final screenshot set.
- `Mongoose 5.12`'s bundled MongoDB driver is officially rated for server \<=5.0, but
  was verified against a local MongoDB 7.0.2 instance during this revamp and connects
  without issue - noted here in case a future MongoDB major version breaks that.

## Testing

No automated test suite ships with this repo. Verification for this revamp was manual
end-to-end: local MongoDB + Express + FastAPI + CRA dev server all running
simultaneously, exercised through the real browser via Playwright (used only to drive
the screenshot captures in `docs/screenshots/`, not as a CI test suite).
