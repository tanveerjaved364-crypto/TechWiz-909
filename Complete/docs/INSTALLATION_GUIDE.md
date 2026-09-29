# Installation Guide — SkillSprint AI

> **SRS Reference:** Section 11 — Installation Instructions

---

## Prerequisites

| Requirement | Minimum Version | Download |
|-------------|----------------|----------|
| Python | 3.8+ | [python.org](https://www.python.org/downloads/) |
| pip | (bundled with Python) | — |
| Git | Any recent version | [git-scm.com](https://git-scm.com/) |
| Web Browser | Chrome / Edge / Firefox | — |

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/TechmastersTechWiz5/skillsprint.git
cd skillsprint/Complete
```

## Step 2: Create a Virtual Environment

```bash
python -m venv .venv

# Activate on Windows:
.venv\Scripts\activate

# Activate on macOS/Linux:
source .venv/bin/activate
```

## Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

**Installed packages include:** Flask, Werkzeug, python-dotenv, pymongo, python-docx, openpyxl, reportlab, groq, openai.

## Step 4: Configure API Keys (Secure)

```bash
# Copy the example environment file
copy .env.example .env        # Windows
cp .env.example .env          # macOS/Linux
```

Open `.env` in any text editor and fill in your credentials:

```env
GROQ_API_KEY=gsk_your_actual_key_here
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/skillsprint
SKILLSPRINT_SECRET_KEY=any-random-secret-string
```

> ⚠️ **IMPORTANT:** The `.env` file is listed in `.gitignore` and must NEVER be committed to the repository. API keys stay local only.

### No API Key? No Problem!

If you leave `GROQ_API_KEY` blank, the system automatically uses an **offline structured-template fallback** engine. All features work — only the AI-generated text quality changes.

## Step 5: Database Configuration

**No manual setup required.** The application automatically:
- Creates `data/skillsprint.db` (SQLite) on first startup
- Initializes all 15+ tables (users, documents, chunks, requirements, plans, etc.)
- Seeds demo users (admin, emp001)
- Loads 20+ pre-built policy documents from `novatech_docx_dataset/`

### Optional: MongoDB Atlas Sync

Set `MONGODB_URI` in `.env` and `MONGODB_SYNC_ON_START=true` to mirror SQLite writes to MongoDB Atlas in real-time.

## Step 6: Document Setup

The `novatech_docx_dataset/` folder contains 20+ pre-built `.docx` policy documents for NovaTech Solutions:

| Category | Count | Examples |
|----------|-------|---------|
| Company Handbook | 1 | `POL-01_Company_Handbook.docx` |
| HR/Leave/Security Policies | 4 | `POL-02_HR_Policy.docx`, `POL-03_Information_Security_v1.docx` |
| SOPs | 5 | `SOP-01_Customer_Escalation.docx`, `SOP-04_Bug_Triaging.docx` |
| Role Descriptions | 10 | `RD-01_Customer_Support_Executive.docx` through `RD-10_Team_Leader.docx` |
| FAQs | 2 | `FAQ-01_IT_Security.docx`, `FAQ-02_HR_Leave.docx` |
| Adversarial Test | 1 | `ADV-01_Hidden_Memo.docx` (prompt injection test case) |

These are auto-uploaded and parsed on first boot.

## Step 7: Start the Application

```bash
python app.py
```

Expected output:
```
 * Serving Flask app 'app'
 * Running on http://127.0.0.1:5000
```

Open **http://127.0.0.1:5000** in your browser.

## Step 8: Run Tests

```bash
python -c "import tests.test_srs_controls as t; t.test_requirement_extraction_carries_classification(); t.test_validation_flags_unsupported_item(); t.test_document_formats_are_supported(); t.test_get_roles_endpoint(); t.test_public_user_registration(); t.test_admin_create_employee_and_user(); print('ALL TESTS PASSED!')"
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError` | Run `pip install -r requirements.txt` inside your activated virtual environment |
| Port 5000 already in use | Kill existing processes: `Stop-Process -Name "python" -Force` (Windows) or `kill $(lsof -ti:5000)` (Linux) |
| AI generation fails | Verify `GROQ_API_KEY` in `.env`. If quota exceeded, the fallback engine activates automatically |
| Database locked | Stop the server, delete `data/skillsprint.db`, restart with `python app.py` |
| MongoDB connection timeout | Ensure `MONGODB_URI` is correct. The app continues with local SQLite if MongoDB is unreachable |
| `.docx` parsing errors | Ensure `python-docx` is installed: `pip install python-docx` |
