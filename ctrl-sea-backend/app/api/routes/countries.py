from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.services.demo_data import country_analytics_payload

router = APIRouter()


@router.get("/analytics")
def analytics(_: object = Depends(get_current_user)) -> dict:
    return country_analytics_payload()
