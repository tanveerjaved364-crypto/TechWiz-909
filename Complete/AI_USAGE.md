# AI Tool Usage Declaration

## Runtime GenAI Provider

| Field | Value |
|-------|-------|
| Provider | Groq API (OpenAI-compatible) |
| Model | `openai/gpt-oss-120b` (configurable via `.env`) |
| Purpose | Source-grounded onboarding plan generation and adaptive learning recommendations |
| Configuration | Local `.env` file only (never committed to repository) |
| Fallback | Deterministic structured-template pipeline when GenAI is unavailable |

## AI-Assisted Development

| Tool | Purpose | Prompt Summary | Files/Modules | Modification | Test | Verifying Member |
|------|---------|---------------|---------------|-------------- |------|-----------------|
| Gemini 3.7 Flash | Code scaffolding | Implement SkillSprint AI SRS with dual pipeline architecture | `app.py`, `mongo_store.py` | Full implementation of Flask routes, SQLite schema, validation pipeline | `tests/test_srs_controls.py` | Team lead |
| Gemini 3.7 Flash | Frontend development | Build admin and employee dashboards with modern UI | `static/admin.html`, `static/admin.js`, `static/employee.html`, `static/employee.js` | Complete dashboard UI with tabs, modals, progress tracking | Manual browser testing | Team lead |
| Gemini 3.7 Flash | Documentation | Generate project report, security testing report, technical blog | `PROJECT_REPORT.md`, `SECURITY_TESTING_REPORT.md`, `TECHNICAL_BLOG.md` | Full document generation and review | Content review | Team lead |
| Gemini 3.7 Flash | Prompt engineering | Design versioned GenAI prompts for plan generation and recommendations | `prompts/onboarding_plan_v1.txt`, `prompts/adaptive_recommendations_v1.txt` | Prompt design with source-grounding and injection defense | GenAI test endpoint | Team lead |
| Gemini 3.7 Flash | Test development | Write automated test assertions for SRS controls | `tests/test_srs_controls.py` | Unit tests for requirement extraction, validation, registration, admin workflows | `pytest tests/` | Team lead |

## GenAI Boundary Rules

- **GenAI generates content** — Python validates, scores and gates it independently.
- **No GenAI replaces Python validation** — Coverage score, traceability, contradiction and sequence checks are pure Python.
- **No hard-coded plans/answers/scores** — Every plan is generated from the live requirement matrix.
- **Prompt injection defense** — Uploaded documents are treated as data only; embedded instructions are flagged and blocked.
- **All GenAI output is logged** — `generation_logs` table records provider, model, prompt version, attempt, status, and errors.
