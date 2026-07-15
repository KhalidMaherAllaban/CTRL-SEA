import time

from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.logging import get_logger
from app.core.security import get_password_hash
from app.database.session import Base, engine
from app.models.user import User

logger = get_logger(__name__)


def create_tables() -> None:
    logger.info("Creating or validating the application identity table")
    User.__table__.create(bind=engine, checkfirst=True)
    table_names = sorted(inspect(engine).get_table_names(schema="dbo"))
    logger.info("Database tables available: %s", ", ".join(table_names))
    if "AppUser" not in table_names:
        raise RuntimeError("AppUser table was not created")


def seed_admin(settings: Settings) -> None:
    if not settings.seed_admin_enabled or settings.environment.lower() not in {"development", "dev", "local"}:
        logger.info("Development admin seeding disabled")
        return

    with Session(engine) as db:
        existing_count = db.query(User).count()
        if existing_count > 0:
            logger.info("Skipping seed admin because %s user(s) already exist", existing_count)
            return
        user = User(
            email=settings.seed_admin_email.lower(),
            full_name=settings.seed_admin_name,
            hashed_password=get_password_hash(settings.seed_admin_password),
            role="admin",
            is_active=True,
        )
        db.add(user)
        db.commit()
        logger.info("Seeded development admin user_id=%s", user.id)


def validate_database(settings: Settings) -> None:
    """Wait for SQL Server and validate the configured database connection."""
    for attempt in range(1, settings.startup_max_attempts + 1):
        try:
            with engine.connect() as conn:
                version = conn.execute(text("SELECT CAST(SERVERPROPERTY('ProductVersion') AS VARCHAR(50))")).scalar_one()
                conn.execute(text("SELECT 1"))
            logger.info("SQL Server connection validated version=%s attempt=%s", version, attempt)
            return
        except SQLAlchemyError:
            logger.exception(
                "SQL Server startup validation failed attempt=%s max_attempts=%s retry_seconds=%s",
                attempt,
                settings.startup_max_attempts,
                settings.startup_retry_seconds,
            )
            if attempt == settings.startup_max_attempts:
                raise RuntimeError(
                    "SQL Server is unavailable after startup retries. Check DATABASE_URL, the SQL Server service, "
                    "ODBC Driver 18, and .runtime/backend.err.log."
                )
            time.sleep(settings.startup_retry_seconds)


def initialize_database(settings: Settings) -> None:
    validate_database(settings)
    create_tables()
    seed_admin(settings)
