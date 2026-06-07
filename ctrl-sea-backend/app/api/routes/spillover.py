from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.maritime import SpilloverRequest, SpilloverResponse
from app.services.demo_data import spillover_payload

router = APIRouter()


@router.post("/simulate", response_model=SpilloverResponse)
def simulate(payload: SpilloverRequest, _: object = Depends(get_current_user)) -> SpilloverResponse:
    return SpilloverResponse(**spillover_payload(payload.port, payload.country, payload.industry, payload.scenario))

