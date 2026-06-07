from fastapi import APIRouter

from app.schemas.maritime import DashboardOverview
from app.services.demo_data import dashboard_payload

router = APIRouter()


@router.get("", response_model=DashboardOverview)
def overview() -> DashboardOverview:
    return DashboardOverview(**dashboard_payload())
