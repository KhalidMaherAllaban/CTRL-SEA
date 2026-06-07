from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.maritime import TradeRiskResponse
from app.services.demo_data import trade_payload

router = APIRouter()


@router.get("", response_model=TradeRiskResponse)
def trade_risk(_: object = Depends(get_current_user)) -> TradeRiskResponse:
    return TradeRiskResponse(**trade_payload())

