# SkillSprint AI

A runnable, source-grounded onboarding platform with a dual-pipeline design: a structured generation pipeline and an independent Python validation pipeline. It deliberately ships with fictional Northstar Industries data so it is safe to demonstrate.

## Quick start

1. Install Python 3.11+ and run `pip install -r requirements.txt`.
2. Run `python app.py`.
3. Open `http://127.0.0.1:5000`.

## Role-based access

The landing page is now a login page. Admin users are directed to `/admin`, where they can upload and approve documents, manage the requirement evidence, generate plans, and export reports. Employee users are directed to `/portal`, where they can see only their own assigned onboarding plan and mark modules complete.

Demo accounts (change these before deployment):

- Admin: `admin` / `Admin@123`
- Training manager: `manager` / `Manager@123`
- Reviewer: `reviewer` / `Reviewer@123`
- Employee: `emp001` / `Welcome@123`

The CRM workspace provides operational overview metrics, plan/document status charts, a review queue, searchable employee/document/matrix registers, and compliance export. Admins can manage all operational actions, managers can generate plans and track compliance, reviewers can upload and approve evidence, and employees can access only their own assigned plan. Employee sessions receive a `403` response for workspace APIs and cannot access another employee's plan. Set a strong `SKILLSPRINT_SECRET_KEY` environment variable before deploying.

The first start creates `data/skillsprint.db`, 20 source documents, 150 requirements, and 10 employee profiles. The seed set includes 10 version changes/conflict pairs and 10 prompt-injection cases. Injection text is flagged and always treated as document data; it is never instructions to the system.

## Evidence and controls

The role matrix has 150 requirement records (100 mandatory and all role-specific). Generating any of the 10 supplied employee plans produces structured JSON only, then checks source IDs, section IDs, active versions, mandatory coverage, duplicate content, role alignment, and unsupported requirements. The deterministic offline generator makes ten 15-item plans, yielding 150 comparable requirement checks, exceeding the required 100-comparison evidence. Use the dashboard's Export CSV button after generation for a submission-ready comparison report.

Uploads accept only PDF/DOCX, reject oversized, duplicate and empty files, retain chunks and trace metadata, and require approval before they can be trusted. Select the intended role, upload the file, then press **Approve** beside its Pending Review entry. Approval makes it active and extracts applicable clauses into the role matrix. A prompt-injection flag deliberately blocks approval for security review. A production deployment should add authentication/RBAC, PostgreSQL, object storage, background jobs, audit logging, an approved LLM provider with JSON-schema output, and signed report export.

## API

- `GET /api/dashboard`, `/api/documents`, `/api/requirements`, `/api/employees`
- `POST /api/documents/upload` (multipart file, title/version/category/department)
- `POST /api/documents/{id}/approve`
- `POST /api/generate/{employee_id}`
- `POST /api/progress` and `GET /api/export/compliance.csv`

## Validation statuses

`Verified` requires 100% mandatory coverage, active traceable sources, no unsupported items, no mismatches, and no duplicates. Unsafe source reference, matrix mismatch, or unknown requirement gives `Manual Review Required`; other gaps give `Verified with Warning`.
