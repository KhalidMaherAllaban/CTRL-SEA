from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.maritime import ReportRead

router = APIRouter()


@router.get("", response_model=list[ReportRead])
def list_reports(_: object = Depends(get_current_user)) -> list[ReportRead]:
    return [
        ReportRead(id="executive-risk", title="Executive Maritime Risk", description="Board-level view of trade exposure, disruption severity, and climate risk.", embed_url="https://app.powerbi.com/reportEmbed?reportId=demo-executive", workspace="CTRL SEA"),
        ReportRead(id="portwatch", title="PortWatch IMF Analytics", description="Operational port call, chokepoint, and supply-chain sensitivity report.", embed_url="https://app.powerbi.com/reportEmbed?reportId=demo-portwatch", workspace="CTRL SEA"),
    ]

