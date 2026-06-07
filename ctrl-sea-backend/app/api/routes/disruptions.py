from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.maritime import DisruptionRead
from app.services.demo_data import disruptions_payload

router = APIRouter()


@router.get("", response_model=list[DisruptionRead])
def list_disruptions(_: object = Depends(get_current_user)) -> list[DisruptionRead]:
    return [DisruptionRead(**row) for row in disruptions_payload()]

