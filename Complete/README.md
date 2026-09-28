# SkillSprint AI

A runnable, source-grounded employee onboarding platform with a dual-pipeline architecture: a structured AI generation pipeline and an independent Python deterministic validation pipeline. The system includes full role-based access control (RBAC), self-registration, admin user management, interactive employee learning portal, and MongoDB Atlas synchronization.

---

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
2. **Start the server**:
   ```bash
   python app.py
   ```
3. **Open in browser**:
   Navigate to `http://127.0.0.1:5000`.

---

## 👥 Demo Accounts & Access Control

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `Admin@123` | Full workspace access, user management, policy approval |
| **Manager** | `manager` | `Manager@123` | Plan generation, progress tracking, leave review |
| **Reviewer** | `reviewer` | `Reviewer@123` | Evidence verification, document approval |
| **Employee** | `emp001` | `Welcome@123` | Personal onboarding roadmap, quizzes, leave requests |

> **Self-Registration:** New users can directly register their own account from the login page (`/login`) by choosing their role, department, and experience level.

---

## 🛠️ Key Modules & Capabilities

### 1. User Registration & Onboarding Module
- **Public Self-Registration:** New hires can register at `/login` with full name, username, password, role, department, experience, and location.
- **Admin User Management:** In the Admin CRM (`/admin`), administrators and managers can register new employees and system users, configure system access roles, and auto-generate verified onboarding plans.
- **Account Status Controls:** Administrators can toggle user accounts active/inactive from the user management panel.

### 2. Modern Employee Learning Portal (`/portal`)
- **Visual Roadmap:** Six structured stages (Day 1, Week 1, Week 2, 30 Days, 60 Days, 90 Days) with mandatory/optional requirement badges.
- **Source Policy Citations:** Every module links directly to its source policy document and section.
- **Interactive Knowledge Check Quizzes:** Instant validation, scoring, and explanations.
- **Progress Tracking:** Real-time completion progress bar and metric statistics.
- **Smart AI Recommendations:** Tailored next steps and action items based on assessment scores.
- **Leave Request System:** Apply for time-off and track real-time HR approvals and comments.
- **Evidence Upload:** Submit signed acknowledgements and certificates for HR review.

### 3. Dual-Pipeline AI Generation & Python Validation
- **Structured Generation:** Groq (`openai/gpt-oss-120b`), OpenAI, or offline structured template fallback producing schema-enforced onboarding plans.
- **Independent Python Validation:** 100% independent checks for mandatory coverage, source document validity, duplicate items, rubric weights, and prompt-injection safety.
- **Policy Precedence:** Enforces strict authority hierarchy (`Company Handbook` > `Policy` > `SOP` > `FAQ`).

### 4. MongoDB Atlas Synchronization
- Automatically mirrors SQLite database writes to MongoDB Atlas collections if `MONGODB_URI` is configured.
- Fully resilient: continues local operation seamlessly during network offline states.

---

## 📡 API Endpoints

### Authentication & User Management
- `GET /api/roles` — Returns available organizational roles and stages.
- `POST /api/auth/register` — Public employee self-registration.
- `POST /api/auth/login` — Sign in and session creation.
- `POST /api/auth/logout` — End user session.
- `GET /api/auth/me` — Current authenticated user profile.
- `POST /api/admin/employees` — Admin/Manager employee and user account creation.
- `GET /api/admin/users` — Admin list of all system users.
- `POST /api/admin/users/<user_id>/toggle-status` — Activate/deactivate user account.

### Admin & Operations
- `GET /api/dashboard` & `GET /api/analytics` — CRM operational metrics and status charts.
- `GET /api/employees` — Employee profiles and learning statuses.
- `GET /api/documents` — Document register with status and injection scan flags.
- `POST /api/documents/upload` — Upload PDF/DOCX/TXT/MD policies and SOPs.
- `POST /api/documents/<id>/approve` — Approve document and extract role matrix requirements.
- `POST /api/generate/<employee_id>` — AI plan generation and validation.
- `GET /api/plans` & `GET /api/plans/<id>` — View plans, validation reports, and reviews.
- `POST /api/plans/<id>/review` — HR review, approval, or override.
- `GET /api/export/compliance.csv` (.xlsx, .pdf) — Export compliance reports.

### Employee Portal
- `GET /api/employee/dashboard` — Authenticated employee's assigned plan, events, notices, and progress.
- `POST /api/employee/progress` — Mark module complete.
- `POST /api/learning-attempts` — Record quiz attempt and score.
- `POST /api/employee/leave-requests` — Submit leave request.
- `POST /api/employee/documents/submit` — Submit supporting evidence file.
- `GET /api/employees/<id>/recommendations` — Fetch adaptive AI recommendations.

---

## 🧪 Testing

Run the automated test suite:
```bash
python -c "import tests.test_srs_controls as t; t.test_requirement_extraction_carries_classification(); t.test_validation_flags_unsupported_item(); t.test_document_formats_are_supported(); t.test_get_roles_endpoint(); t.test_public_user_registration(); t.test_admin_create_employee_and_user(); print('ALL TESTS PASSED!')"
```

---

## 🔑 Evaluator Login Details

- **Admin Portal**: `http://127.0.0.1:5000/admin`
  - Username: `admin`
  - Password: `Admin@123`
- **Employee Portal**: `http://127.0.0.1:5000/portal`
  - Username: `emp001` (up to `emp010`)
  - Password: `Welcome@123`
