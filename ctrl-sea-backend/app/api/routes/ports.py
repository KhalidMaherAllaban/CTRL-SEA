from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.common import PaginatedResponse
from app.schemas.maritime import PortRead
from app.services import warehouse

router = APIRouter()

@router.get("", response_model=PaginatedResponse[PortRead])
def ports(search: str | None = None, country: str | None = None, page: int = Query(1, ge=1), size: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    items, total = warehouse.list_ports(db, search, country, page, size)
    return {"items": items, "total": total, "page": page, "size": size}

@router.get("/analytics")
def analytics(db: Session = Depends(get_db)) -> dict:
    return warehouse.port_analytics(db)

@router.get("/{portid}")
def detail(portid: str, db: Session = Depends(get_db)) -> dict:
    result = warehouse.port_detail(db, portid)
    if not result: raise HTTPException(404, "Port not found")
    return result
