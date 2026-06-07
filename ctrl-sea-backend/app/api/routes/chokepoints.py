from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.maritime import ChokepointRead
from app.services.demo_data import CHOKEPOINTS, chokepoint_analytics_payload

router = APIRouter()


@router.get("", response_model=list[ChokepointRead])
def list_chokepoints(_: object = Depends(get_current_user)) -> list[ChokepointRead]:
    return [ChokepointRead(**row) for row in CHOKEPOINTS]


@router.get("/analytics")
def analytics(_: object = Depends(get_current_user)) -> dict:
    return chokepoint_analytics_payload()
