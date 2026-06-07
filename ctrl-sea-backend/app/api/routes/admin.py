from fastapi import APIRouter, Depends, File, UploadFile

from app.api.deps import require_admin
from app.schemas.maritime import DatasetUploadResult
from app.services.demo_data import etl_architecture_payload

router = APIRouter()


@router.get("/health")
def health(_: object = Depends(require_admin)) -> dict:
    return {"api": "operational", "etl": "idle", "queueDepth": 0, "latencyMs": 42}


@router.post("/datasets/upload", response_model=DatasetUploadResult)
async def upload_dataset(file: UploadFile = File(...), _: object = Depends(require_admin)) -> DatasetUploadResult:
    import pandas as pd

    dataframe = pd.read_csv(file.file)
    preview = dataframe.head(10).fillna("").to_dict(orient="records")
    return DatasetUploadResult(filename=file.filename or "dataset.csv", rows=len(dataframe), columns=list(dataframe.columns), preview=preview)


@router.post("/etl/run")
def run_etl(_: object = Depends(require_admin)) -> dict:
    payload = etl_architecture_payload()
    return {**payload, "message": "PortWatch-compatible ETL job accepted for execution"}


@router.get("/etl/architecture")
def etl_architecture(_: object = Depends(require_admin)) -> dict:
    return etl_architecture_payload()


@router.get("/users")
def users(_: object = Depends(require_admin)) -> list[dict]:
    return [
        {"id": 1, "name": "Admin Analyst", "email": "admin@ctrlsea.io", "role": "admin", "status": "active"},
        {"id": 2, "name": "Trade Analyst", "email": "trade@ctrlsea.io", "role": "analyst", "status": "active"},
    ]
