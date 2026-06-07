from fastapi import APIRouter, Depends, Query

from app.api.deps import get_current_user
from app.schemas.common import PaginatedResponse
from app.schemas.maritime import PortRead
from app.services.demo_data import PORTS, port_analytics_payload

router = APIRouter()


@router.get("", response_model=PaginatedResponse[PortRead])
def list_ports(
    search: str | None = Query(default=None),
    country: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    _: object = Depends(get_current_user),
) -> PaginatedResponse[PortRead]:
    rows = PORTS
    if search:
        rows = [row for row in rows if search.lower() in row["port_name"].lower() or search.lower() in row["port_code"].lower()]
    if country:
        rows = [row for row in rows if country.lower() in row["country"].lower()]
    total = len(rows)
    start = (page - 1) * size
    items = [PortRead(**row) for row in rows[start : start + size]]
    return PaginatedResponse[PortRead](items=items, total=total, page=page, size=size)


@router.get("/analytics")
def analytics(_: object = Depends(get_current_user)) -> dict:
    return port_analytics_payload()
