import shutil
from datetime import UTC, datetime
from pathlib import Path

from app.core.config import get_settings
from app.database.init_db import initialize_database


def main() -> None:
    settings = get_settings()
    if not settings.database_url.startswith("sqlite:///"):
        raise SystemExit("reset_dev_db.py only handles local sqlite:/// databases")

    db_path = Path(settings.database_url.replace("sqlite:///", "", 1)).resolve()
    if db_path.exists():
        backup_path = db_path.with_suffix(f".{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}.bak")
        shutil.copy2(db_path, backup_path)
        db_path.unlink()
        print(f"Backed up {db_path.name} to {backup_path.name}")

    initialize_database(settings)
    print(f"Recreated local database at {db_path}")


if __name__ == "__main__":
    main()
