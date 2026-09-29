# SkillSprint AI — Project Documentation

This folder contains all required project deliverables as outlined in the Software Requirements Specification (SRS). Each document serves a specific purpose in the final submission package.

---

## 📁 Folder Contents

| # | File | SRS Section | Purpose |
|---|------|-------------|---------|
| 1 | `INSTALLATION_GUIDE.md` | Section 11 | Step-by-step installation, environment setup, API keys, database config, startup, and troubleshooting |
| 2 | `EXECUTION_GUIDE.md` | Section 12 | How to run every feature — login, upload, generate, validate, approve, export |
| 3 | `ARCHITECTURE.md` | Section 13 | System architecture, data flow diagrams, tech stack, dual-pipeline design |
| 4 | `AI_USAGE_DISCLOSURE.md` | Section 14 | Transparent disclosure of all AI tools used during development |
| 5 | `SECURITY_TESTING_REPORT.md` | Section 9 | Prompt injection testing, adversarial inputs, security flag results |
| 6 | `SRS_COMPLIANCE_MATRIX.md` | All | Full 63-requirement checklist mapped to code locations |
| 7 | `TECHNICAL_BLOG.md` | Section 16 | 2000+ word technical blog for publication |
| 8 | `DEMO_VIDEO_SCRIPT.md` | Section 15 | Step-by-step script for recording the 5–10 min demonstration video |

---

## 🔑 Quick Reference — Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin/HR | `admin` | `Admin@123` |
| Employee | `emp001` | `Welcome@123` |

---

## 🏢 Fictional Company

**NovaTech Solutions Pvt. Ltd.** — A mid-size Indian technology services and consulting company with 500+ employees across Sales, HR, Finance, Operations, Marketing, Engineering, and Customer Support departments.

---

## ⚠️ Important Notes

- **API Keys**: Never committed to this repository. Use `.env.example` → `.env` flow.
- **Database**: Auto-created on first run (`data/skillsprint.db`). Pre-seeded with 20+ policy documents.
- **GenAI Fallback**: If no API key is configured, the system uses an offline structured-template fallback so the app always works.
