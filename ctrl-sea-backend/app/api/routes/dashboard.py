from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.maritime import DashboardOverview
from app.services.warehouse import dashboard

router = APIRouter()

@router.get("", response_model=DashboardOverview)
def overview(db: Session = Depends(get_db)) -> DashboardOverview:
    return DashboardOverview(**dashboard(db))
