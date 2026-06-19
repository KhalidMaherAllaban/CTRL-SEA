from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.maritime import DisruptionRead
from app.services.warehouse import disruption_list
router = APIRouter()

@router.get("", response_model=list[DisruptionRead])
def disruptions(limit: int = Query(250, ge=1, le=1000), db: Session = Depends(get_db)): return disruption_list(db, limit)
