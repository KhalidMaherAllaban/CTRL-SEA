from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.schemas.maritime import ReportRead

router = APIRouter()


@router.get("", response_model=list[ReportRead])
def list_reports(_: object = Depends(get_current_user)) -> list[ReportRead]:
    return [ReportRead.model_validate(report) for report in get_settings().power_bi_reports]
