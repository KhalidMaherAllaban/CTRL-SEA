from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.maritime import ClimateRiskResponse
from app.services.demo_data import climate_payload

router = APIRouter()


@router.get("", response_model=ClimateRiskResponse)
def climate_risk(_: object = Depends(get_current_user)) -> ClimateRiskResponse:
    return ClimateRiskResponse(**climate_payload())

