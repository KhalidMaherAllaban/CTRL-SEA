from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.maritime import ClimateRiskResponse
from app.services.warehouse import climate
router = APIRouter()

@router.get("", response_model=ClimateRiskResponse)
def climate_risk(db: Session = Depends(get_db)): return climate(db)
