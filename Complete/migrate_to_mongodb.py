"""One-command migration of current SkillSprint SQLite data to MongoDB Atlas."""

from pathlib import Path

from mongo_store import sync_sqlite_to_mongodb


PROJECT_ROOT = Path(__file__).parent
SQLITE_DATABASE = PROJECT_ROOT / "data" / "skillsprint.db"


if __name__ == "__main__":
    if not SQLITE_DATABASE.exists():
        raise SystemExit(f"SQLite database was not found: {SQLITE_DATABASE}")

    synced_counts = sync_sqlite_to_mongodb(str(SQLITE_DATABASE))
    total_records = sum(synced_counts.values())
    print(f"MongoDB migration complete: {total_records} records synchronized.")
    for collection_name, count in synced_counts.items():
        print(f"- {collection_name}: {count}")
