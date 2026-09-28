"""MongoDB Atlas synchronization for SkillSprint AI.

SQLite remains a short-lived application cache for the current Flask query code.
MongoDB Atlas holds the cloud copy of every business record and becomes the
portable source for backup/migration. The MongoDB URI is read only from the
MONGODB_URI environment variable; it must never be hard-coded in this file.
"""

from __future__ import annotations

import os
import sqlite3
from datetime import datetime, timezone

from pymongo import MongoClient


DATABASE_NAME = "skillsprint_ai"

# Collection name, source table, and stable document ID field.
TABLE_MAPPINGS = (
    ("users", "users", "id"),
    ("employees", "employees", "id"),
    ("documents", "documents", "id"),
    ("document_chunks", "chunks", "id"),
    ("requirements", "requirements", "id"),
    ("onboarding_plans", "plans", "id"),
    ("completions", "completions", None),
    ("document_roles", "document_roles", "document_id"),
    ("document_submissions", "document_submissions", "document_id"),
    ("events", "events", "id"),
    ("announcements", "announcements", "id"),
    ("leave_requests", "leave_requests", "id"),
)


def get_mongo_database():
    """Return the app's Atlas database using the operating-system secret."""
    mongo_uri = os.environ.get("MONGODB_URI")
    if not mongo_uri:
        raise RuntimeError("MONGODB_URI is not configured.")

    client = MongoClient(mongo_uri, serverSelectionTimeoutMS=15000)
    client.admin.command("ping")
    return client[DATABASE_NAME]


def _document_id(record: dict, primary_key: str | None) -> str:
    """Build a repeatable MongoDB _id for each SQL row."""
    if primary_key:
        return str(record[primary_key])
    return f"{record['employee_id']}:{record['requirement_id']}"


def sync_sqlite_to_mongodb(sqlite_path: str) -> dict[str, int]:
    """Replace app-owned Atlas collections with a consistent SQLite snapshot."""
    mongo_database = get_mongo_database()
    sqlite_connection = sqlite3.connect(sqlite_path)
    sqlite_connection.row_factory = sqlite3.Row
    counts: dict[str, int] = {}

    try:
        for collection_name, table_name, primary_key in TABLE_MAPPINGS:
            records = [dict(row) for row in sqlite_connection.execute(f"SELECT * FROM {table_name}")]
            for record in records:
                record["_id"] = _document_id(record, primary_key)

            collection = mongo_database[collection_name]
            collection.delete_many({})
            if records:
                collection.insert_many(records)
            counts[collection_name] = len(records)

        mongo_database["system"].replace_one(
            {"_id": "sync_status"},
            {
                "_id": "sync_status",
                "source": "SkillSprint AI SQLite cache",
                "last_synced_at": datetime.now(timezone.utc),
                "collection_counts": counts,
            },
            upsert=True,
        )
    finally:
        sqlite_connection.close()

    return counts
