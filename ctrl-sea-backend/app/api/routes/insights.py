from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.warehouse import insights
router = APIRouter()

@router.get("")
def overview(db: Session = Depends(get_db)) -> dict: return insights(db)
