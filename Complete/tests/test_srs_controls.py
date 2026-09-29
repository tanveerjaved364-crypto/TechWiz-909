import os, json, uuid

os.environ["MONGODB_URI"] = ""
os.environ["SKILLSPRINT_AI_PROVIDER"] = "offline"

import app


def test_requirement_extraction_carries_classification():
    entries = app.extract_requirements("Employees must demonstrate the approved escalation process.", "DOC-TEST", "Support")
    assert entries[0][9] == "Must Demonstrate"
    assert entries[0][10] == "Policy and process competency"


def test_validation_flags_unsupported_item():
    employee = {"role": "Sales Executive", "experience": "Beginner"}
    report = app.validate({"generated_items": [{"requirement_id": "NOT-REAL", "source_document_id": "DOC-01", "source_section_id": "P1"}]}, employee)
    assert report["status"] == "Unsupported"


def test_document_formats_are_supported():
    assert {"pdf", "docx", "txt", "md", "csv"}.issubset(app.ALLOWED)


def test_get_roles_endpoint():
    with app.app.test_client() as client:
        res = client.get("/api/roles")
        assert res.status_code == 200
        data = res.get_json()
        assert "roles" in data
        assert len(data["roles"]) >= 10


def test_public_user_registration():
    with app.app.test_client() as client:
        unique_user = f"test_reg_{uuid.uuid4().hex[:6]}"
        payload = {
            "name": "Test User Registration",
            "username": unique_user,
            "password": "Password@123",
            "role": "Customer Support Executive",
            "department": "Customer Experience",
            "experience": "Beginner",
            "location": "Head Office"
        }
        res = client.post("/api/auth/register", json=payload)
        assert res.status_code == 200
        data = res.get_json()
        assert data.get("ok") is True
        assert data.get("redirect") == "/portal"


def test_admin_create_employee_and_user():
    with app.app.test_client() as client:
        # Sign in as admin
        login_res = client.post("/api/auth/login", json={"username": "admin", "password": "Admin@123"})
        assert login_res.status_code == 200

        # Create new employee
        unique_emp_user = f"admin_emp_{uuid.uuid4().hex[:6]}"
        payload = {
            "name": "Admin Created Employee",
            "username": unique_emp_user,
            "password": "Welcome@123",
            "role": "Software Support Engineer",
            "account_role": "employee",
            "department": "Engineering & IT",
            "experience": "Intermediate",
            "location": "Head Office",
            "auto_generate_plan": True
        }
        res = client.post("/api/admin/employees", json=payload)
        assert res.status_code == 201
        data = res.get_json()
        assert data.get("ok") is True
        assert "employee_id" in data

        # List users
        users_res = client.get("/api/admin/users")
        assert users_res.status_code == 200
        users_data = users_res.get_json()
        assert any(u["username"] == unique_emp_user for u in users_data)
