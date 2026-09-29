# Execution Guide — SkillSprint AI

> **SRS Reference:** Section 12 — Execution Instructions

This guide walks through every feature of the system step-by-step.

---

## Login

1. Open `http://127.0.0.1:5000/login`
2. Enter credentials:
   - **Admin/HR:** `admin` / `Admin@123`
   - **Employee:** `emp001` / `Welcome@123`
3. Admin users are redirected to `/admin` (CRM Dashboard)
4. Employees are redirected to `/portal` (Learning Portal)

---

## Admin Workflow

### Upload Documents
1. Go to **Admin Dashboard → Documents** tab
2. Click **"Upload Document"**
3. Select a `.txt`, `.md`, `.pdf`, or `.docx` file
4. Fill in metadata: title, category (Policy/SOP/FAQ/Role Description), department, effective date
5. Click **"Upload"** — document enters **"Pending Review"** status
6. System automatically parses text, creates chunks, and scans for prompt injection

### Review & Approve/Reject Documents
1. In the **Documents** tab, find a document with status "Pending Review"
2. Click **"Review"** button
3. A modal popup opens showing the **full document content**
4. Read the content, then choose:
   - **"Approve"** → Document becomes Active, requirements are extracted
   - **"Reject"** → Document is marked Rejected
5. If a document has a **Security Flag** (prompt injection detected), the Approve button is hidden — only Reject is available

### Create Employees
1. Go to **Users** tab
2. Fill the registration form: name, username, password, role, department, experience level
3. Click **"Create"** — employee account is instantly active

### Generate Onboarding Plans
1. Go to **Employees** tab
2. Find an employee and click **"Generate Plan"**
3. The GenAI pipeline creates a personalized onboarding plan
4. Python validation automatically runs and produces a comparison report
5. View the plan to see match/mismatch scores, missing modules, and hallucination flags

### Review Plans
1. Go to **Plans** tab
2. Click on any plan to expand details
3. Review the **validation report**: coverage %, unsupported items, contradictions
4. Click **"Approve"** or provide feedback via the review form

### Impact Analysis
1. Upload a **new version** of an existing policy document
2. Go to **Impact Analysis** tab
3. System shows all plans affected by the policy change
4. Click **"Regenerate"** to update affected plans

### Export Reports
1. Go to **Requirements** tab
2. Click **"Export CSV"**, **"Export Excel"**, or **"Export PDF"**
3. Compliance reports download automatically

### Manage Leave Requests
1. Go to **Leave Requests** tab
2. View pending employee requests
3. **Approve** or **Reject** with comments

---

## Employee Workflow

### View Learning Roadmap
1. Login as `emp001` / `Welcome@123`
2. The dashboard shows your assigned onboarding plan organized in 6 stages:
   - Day 1 → Week 1 → Week 2 → First 30 Days → First 60 Days → First 90 Days
3. Each module shows: objective, task, source policy citation, mandatory/optional badge

### Take Quizzes
1. Click on any module card
2. Complete the knowledge-check quiz
3. View instant results: score, correct answers, explanations

### Mark Progress
1. Click **"Mark Complete"** on finished modules
2. The progress bar updates in real-time

### Upload Evidence
1. Click **"Upload Evidence"** 
2. Select a document (signed acknowledgement, certificate, etc.)
3. File is submitted to Admin/HR for review

### View Recommendations
1. Scroll to the **"AI Recommendations"** section
2. System suggests next priority actions based on your quiz scores

### Apply for Leave
1. Click **"Apply for Leave"**
2. Fill in: leave type, start date, end date, reason
3. Submit — HR receives the request for review

---

## Testing Prompt Injection / Security

1. Login as **Admin**
2. Go to **Documents → Upload**
3. Upload the file `dummy_test_files/Dummy_Adversarial_Bad.txt`
4. The system will flag it with **injection_flag = 1** and status = **"Security Review"**
5. When you click "Review", you can read the injected text but **cannot Approve** — only Reject

---

## Testing Normal Evidence Upload

1. Login as **emp001**
2. Click **"Upload Evidence"**
3. Upload `dummy_test_files/Dummy_Evidence_Good.txt`
4. Login as **Admin** and go to Documents
5. Click **"Review"** on the submitted evidence — you can see the content and Approve or Reject
