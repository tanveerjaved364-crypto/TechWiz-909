# AI Usage Disclosure

Tool used: OpenAI Codex (GPT-5) in the local development environment.

Prompt summary: implement the SkillSprint AI SRS as a complete source-grounded onboarding application with a dual Python pipeline, fictional dataset, validation evidence, documentation, and a runnable UI.

Runtime GenAI provider: Groq API using `openai/gpt-oss-120b`, configured only through a local ignored `.env` file. The application uses it for source-grounded onboarding content and adaptive recommendations; Python remains responsible for validation and business rules.

Files assisted: `app.py`, `mongo_store.py`, `static/admin.html`, `static/admin.js`, `static/employee.html`, `static/employee.js`, `README.md`, `PROJECT_REPORT.md`, versioned files in `prompts/`, and test controls in `tests/`. All generated code should be reviewed, tested, and owned by the project team before submission. Secrets must never be committed; local runtime keys belong only in `.env`.
