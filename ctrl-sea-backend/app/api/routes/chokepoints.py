from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services import warehouse
router = APIRouter()

@router.get("")
def items(db: Session = Depends(get_db)) -> list[dict]: return warehouse.chokepoint_items(db)

@router.get("/analytics")
def analytics(db: Session = Depends(get_db)) -> dict: return warehouse.chokepoint_analytics(db)
