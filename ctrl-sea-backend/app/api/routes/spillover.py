from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.maritime import SpilloverRequest, SpilloverResponse
from app.services.warehouse import spillover
router = APIRouter()

@router.post("", response_model=SpilloverResponse)
@router.post("/simulate", response_model=SpilloverResponse)
def simulate(payload: SpilloverRequest, db: Session = Depends(get_db)): return spillover(db, payload.port, payload.country, payload.industry, payload.scenario)
