# SkillSprint AI

A runnable, source-grounded onboarding platform with a dual-pipeline design: a structured generation pipeline and an independent Python validation pipeline. It deliberately ships with fictional Northstar Industries data so it is safe to demonstrate.

## Quick start

1. Install Python 3.11+ and run `pip install -r requirements.txt`.
2. Run `python app.py`.
3. Open `http://127.0.0.1:5000`.

The first start creates `data/skillsprint.db`, 20 source documents, 150 requirements, and 10 employee profiles. The seed set includes 10 version changes/conflict pairs and 10 prompt-injection cases. Injection text is flagged and always treated as document data; it is never instructions to the system.

## Evidence and controls

The role matrix has 150 requirement records (100 mandatory and all role-specific). Generating any of the 10 supplied employee plans produces structured JSON only, then checks source IDs, section IDs, active versions, mandatory coverage, duplicate content, role alignment, and unsupported requirements. The deterministic offline generator makes ten 15-item plans, yielding 150 comparable requirement checks, exceeding the required 100-comparison evidence. Use the dashboard's Export CSV button after generation for a submission-ready comparison report.

Uploads accept only PDF/DOCX, reject oversized, duplicate and empty files, retain chunks and trace metadata, and require approval before they can be trusted. A production deployment should add authentication/RBAC, PostgreSQL, object storage, background jobs, audit logging, an approved LLM provider with JSON-schema output, and signed report export.

## API

- `GET /api/dashboard`, `/api/documents`, `/api/requirements`, `/api/employees`
- `POST /api/documents/upload` (multipart file, title/version/category/department)
- `POST /api/documents/{id}/approve`
- `POST /api/generate/{employee_id}`
- `POST /api/progress` and `GET /api/export/compliance.csv`

## Validation statuses

`Verified` requires 100% mandatory coverage, active traceable sources, no unsupported items, no mismatches, and no duplicates. Unsafe source reference, matrix mismatch, or unknown requirement gives `Manual Review Required`; other gaps give `Verified with Warning`.
