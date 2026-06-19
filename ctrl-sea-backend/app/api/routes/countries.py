from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services import warehouse

router = APIRouter()

@router.get("")
def countries(page: int = Query(1, ge=1), size: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)) -> dict:
    all_rows = warehouse.country_rankings(db, 237)
    return {"items": all_rows[(page-1)*size:page*size], "total": len(all_rows), "page": page, "size": size}

@router.get("/analytics")
def analytics(db: Session = Depends(get_db)) -> dict:
    return warehouse.country_analytics(db)

@router.get("/{iso3}")
def detail(iso3: str, db: Session = Depends(get_db)) -> dict:
    result = warehouse.country_detail(db, iso3)
    if not result: raise HTTPException(404, "Country not found")
    return result
