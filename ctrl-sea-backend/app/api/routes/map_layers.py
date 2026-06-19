from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.warehouse import map_layers
router = APIRouter()

@router.get("")
@router.get("/layers")
def layers(route_limit: int = Query(300, ge=10, le=1000), db: Session = Depends(get_db)) -> dict:
    return map_layers(db, route_limit)
