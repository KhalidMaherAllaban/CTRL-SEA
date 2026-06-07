from fastapi import APIRouter

from app.services.demo_data import map_payload

router = APIRouter()


@router.get("/layers")
def layers() -> dict:
    return map_payload()
