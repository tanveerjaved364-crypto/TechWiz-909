# SkillSprint AI - Code Study Guide

This guide is for rebuilding the same project yourself. Read and type the files in the order below. Run the test checklist after each section instead of waiting until the end.

## 1. Project map

| File | Responsibility |
|---|---|
| `app.py` | Flask server, SQLite database, authentication, authorization, document processing, plan generation, and validation APIs. |
| `static/login.html` + `static/login.js` | Secure login screen and role-based redirect. |
| `static/admin.html` + `static/admin.js` | CRM workspace for Admin, Manager, and Reviewer. |
| `static/employee.html` + `static/employee.js` | Employee's own plan, progress and document submissions. |
| `static/crm.css` | Admin CRM visual system. |
| `static/style.css` + `static/employee.css` | Login/employee shared styling. |
| `README.md` | Installation and demo credentials. |

## 2. Backend typing order (`app.py`)

1. **Imports and constants**: file paths, supported extensions, onboarding stages, roles and injection-detection pattern.
2. **Database helpers**: `con`, `rows`, `one`, and `execute`. Every database request goes through these helpers.
3. **Business logic**:
   - `extract_requirements` turns controlled words such as `must`, `required` and `optional` into matrix rows.
   - `document_text` reads PDF/DOCX text.
   - `generate` makes structured plan JSON.
   - `validate` independently checks the JSON against active source evidence and the requirement matrix.
4. **Database setup**: `init_db`, `seed`, and `seed_users` create the schema and safe fictional demo data.
5. **Security decorators**:
   - `api_auth` protects JSON APIs.
   - `page_auth` protects HTML pages.
6. **Routes**: login first, then admin routes, then employee routes.

Never remove the `@api_auth(...)` decorators. The frontend hiding a button is not authorization: the backend decorator is what stops a user calling a protected URL directly.

## 3. Frontend typing order

### Admin workspace

1. Type `admin.html` first. IDs such as `employeeRows`, `docs`, `plansList`, and `planDetail` are the connection points used by JavaScript.
2. Type `admin.js` next:
   - `api()` is the shared fetch wrapper. It expects JSON and turns an API error into a JavaScript error.
   - `load()` fetches all current CRM data, puts it in `state`, then calls render functions.
   - `renderEmployees`, `renderDocuments`, `renderMatrix`, and `renderPlans` build each visible register.
   - `generate()` creates a plan and calls `openPlan()` to show the full output rather than a browser popup.
3. Type `crm.css` last. It controls only appearance and should not contain any business logic.

### Employee portal

1. `employee.html` defines the personal plan area and the document submission form.
2. `employee.js` loads only `/api/employee/dashboard`; it never receives other employees' plan data.
3. `complete()` posts the selected requirement ID to `/api/employee/progress`, then reloads the current state. The backend confirms that the requirement belongs to the logged-in employee.

## 4. Important data flow

```text
Admin/Reviewer uploads document
  -> Pending Review
  -> Admin/Reviewer approves
  -> Active source + requirement matrix rows
  -> Manager/Admin generates employee plan
  -> Python validator verifies plan
  -> Employee sees own plan and marks assigned items complete
```

An employee document follows the same safe route, but employee submission never activates it automatically:

```text
Employee submits PDF/DOCX -> Pending Review -> Admin/Reviewer approval -> Active evidence
```

## 5. Required tests after retyping

Run the app with `python app.py`, then test the following in the browser:

1. Open `/api/dashboard` while logged out: it must return `401`.
2. Sign in as `admin / Admin@123`: `/admin` opens.
3. Sign in as `emp001 / Welcome@123`: `/portal` opens.
4. As employee, open `/api/dashboard`: it must return `403`.
5. In Admin > Employees, generate a plan and verify that the complete plan appears in Plans & compliance.
6. In Employee portal, click Mark complete and confirm the button becomes `Completed` and the completed count increases.
7. Submit a DOCX as employee. Confirm it is Pending Review.
8. Sign in as Admin or Reviewer, approve that document, and confirm it becomes Active.

## 6. Commands

```powershell
cd D:\git\TechWiz-909\Complete
python -m pip install -r requirements.txt
python app.py
```

For future formatting, run:

```powershell
python -m black app.py
npx.cmd prettier --write static\*.html static\*.js static\*.css
```

Use `Ctrl + F5` after frontend changes so the browser loads new CSS and JavaScript.
