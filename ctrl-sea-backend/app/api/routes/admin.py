from time import perf_counter
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.database.session import engine, get_db
from app.models.user import User
from app.schemas.maritime import DatasetUploadResult

router = APIRouter()
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_UPLOAD_TYPES = {"text/csv", "application/vnd.ms-excel"}
ALLOWED_UPLOAD_SUFFIXES = {".csv"}


@router.get("/health")
def health(_: object = Depends(require_admin), db: Session = Depends(get_db)) -> dict:
    started = perf_counter()
    db.execute(text("SELECT 1"))
    return {"api": "operational", "warehouse": "connected", "latencyMs": round((perf_counter() - started) * 1000, 2)}


@router.post("/datasets/upload", response_model=DatasetUploadResult)
async def upload_dataset(file: UploadFile = File(...), _: object = Depends(require_admin)) -> DatasetUploadResult:
    import pandas as pd

    filename = Path(file.filename or "dataset.csv").name
    suffix = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if suffix not in ALLOWED_UPLOAD_SUFFIXES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only CSV uploads are supported")
    if file.content_type and file.content_type not in ALLOWED_UPLOAD_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid upload content type")
    content = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Upload exceeds 5 MB limit")
    if not content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload is empty")
    from io import BytesIO

    try:
        dataframe = pd.read_csv(BytesIO(content))
    except (pd.errors.ParserError, UnicodeDecodeError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV content could not be parsed") from exc
    if len(dataframe.columns) > 200:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="CSV contains too many columns")
    preview = dataframe.head(10).fillna("").to_dict(orient="records")
    return DatasetUploadResult(filename=filename, rows=len(dataframe), columns=list(dataframe.columns), preview=preview)


@router.post("/etl/run")
def run_etl(_: object = Depends(require_admin)) -> dict:
    raise HTTPException(status_code=501, detail="No ETL orchestrator is configured for this read-optimized warehouse connection")


@router.get("/etl/architecture")
def etl_architecture(_: object = Depends(require_admin)) -> dict:
    inspector = inspect(engine)
    return {"status": "connected", "jobId": "external-etl", "etl_available": False, "layers": [
        {"name": "stg", "description": f"{len(inspector.get_table_names(schema='stg'))} staging tables"},
        {"name": "portwatch_dw", "description": f"{len(inspector.get_table_names(schema='portwatch_dw'))} curated warehouse tables"}],
        "entities": inspector.get_table_names(schema="portwatch_dw")}


@router.get("/users")
def users(_: object = Depends(require_admin), db: Session = Depends(get_db)) -> list[dict]:
    return [{"id": user.id, "name": user.full_name, "email": user.email, "role": user.role,
             "status": "active" if user.is_active else "inactive"} for user in db.query(User).order_by(User.id)]
