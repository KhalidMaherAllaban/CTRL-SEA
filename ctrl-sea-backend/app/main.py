import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.api.router import api_router
from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.database.init_db import initialize_database
from app.database.session import engine
from app.models import maritime, user  # noqa: F401

configure_logging()
logger = get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    logger.info("Starting CTRL SEA API environment=%s database_configured=%s cors_origins=%s", settings.environment, bool(settings.database_url), settings.cors_origin_list)
    try:
        initialize_database(settings)
    except Exception:
        logger.exception("CTRL SEA API startup validation failed")
        raise
    logger.info("CTRL SEA API startup validation complete")
    yield

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="CTRL SEA Maritime Intelligence Platform API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.exception("Request failed method=%s path=%s elapsed_ms=%.2f", request.method, request.url.path, elapsed_ms)
        raise
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info("Request complete method=%s path=%s status=%s elapsed_ms=%.2f", request.method, request.url.path, response.status_code, elapsed_ms)
    return response


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(_: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.exception("Unhandled database error", exc_info=exc)
    return JSONResponse(status_code=503, content={"detail": "Database unavailable"})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled application error", exc_info=exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health")
@app.get("/api/health", include_in_schema=False)
def health() -> dict:
    with engine.connect() as connection:
        connection.exec_driver_sql("SELECT 1")
    return {"status": "healthy", "service": "ctrl-sea-api", "database": "connected"}


app.include_router(api_router)
