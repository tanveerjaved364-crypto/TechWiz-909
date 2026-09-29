# SRS Completion Matrix

## Implemented application controls

| Area | Evidence in project |
| --- | --- |
| Company dataset and matrix | Seeded 20 documents, 10 roles, 150 requirements in `app.py` |
| Document intake | PDF/DOCX/TXT/MD/CSV validation, text extraction, chunk IDs, metadata, versions |
| Employee and role setup | Employee profile fields and role requirement matrix |
| GenAI pipeline | Groq GPT-OSS 120B, versioned prompts, structured JSON, attempt logs, safe fallback |
| Learning plan | Multi-stage modules, tasks, checklist, scenarios, quizzes, assessments, rubrics and sources |
| Python validation | Coverage, traceability, duplicate, source, quiz, rubric, prerequisite, sequence and contradiction checks |
| Review and policy handling | HR approval/comment workflow, audit records, policy impact records and regeneration endpoint |
| Employee learning | Plan release gate, completion tracking, quiz attempts, learning status and recommendations |
| Reports | CSV, PDF and Excel compliance exports |
| Security | RBAC, prompt injection detection, upload validation, ignored `.env` |

## Evidence to produce before evaluation

- Generate and export plans for all ten supplied roles.
- Capture the GenAI/Python comparison rows from each validation report (100+ rows total).
- Record the live Groq connection test and an approved employee plan screenshot.
- Record the security test steps in `SECURITY_TESTING_REPORT.md`.
- Produce the mandatory demo video and deployment URL.
