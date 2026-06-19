from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.api.routes import admin, auth, chokepoints, climate, countries, dashboard, disruptions, insights, map_layers, ports, reports, risk_center, spillover, trade

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
protected = [Depends(get_current_user)]
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"], dependencies=protected)
api_router.include_router(ports.router, prefix="/ports", tags=["ports"], dependencies=protected)
api_router.include_router(countries.router, prefix="/countries", tags=["countries"], dependencies=protected)
api_router.include_router(map_layers.router, prefix="/map", tags=["map"], dependencies=protected)
api_router.include_router(chokepoints.router, prefix="/chokepoints", tags=["chokepoints"], dependencies=protected)
api_router.include_router(climate.router, prefix="/climate-risk", tags=["climate-risk"], dependencies=protected)
api_router.include_router(trade.router, prefix="/trade-risk", tags=["trade-risk"], dependencies=protected)
api_router.include_router(spillover.router, prefix="/spillover", tags=["spillover"], dependencies=protected)
api_router.include_router(disruptions.router, prefix="/disruptions", tags=["disruptions"], dependencies=protected)
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(risk_center.router, prefix="/risk-center", tags=["risk-center"], dependencies=protected)
api_router.include_router(insights.router, prefix="/insights", tags=["insights"], dependencies=protected)
