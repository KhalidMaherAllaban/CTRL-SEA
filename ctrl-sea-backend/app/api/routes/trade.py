from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.maritime import TradeRiskResponse
from app.services.warehouse import trade_risk
router = APIRouter()

@router.get("", response_model=TradeRiskResponse)
def trade(db: Session = Depends(get_db)): return trade_risk(db)
