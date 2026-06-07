from fastapi import APIRouter

from app.api.routes import admin, auth, chokepoints, climate, countries, dashboard, disruptions, map_layers, ports, reports, spillover, trade

api_router = APIRouter(prefix="/api")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(ports.router, prefix="/ports", tags=["ports"])
api_router.include_router(countries.router, prefix="/countries", tags=["countries"])
api_router.include_router(map_layers.router, prefix="/map", tags=["map"])
api_router.include_router(chokepoints.router, prefix="/chokepoints", tags=["chokepoints"])
api_router.include_router(climate.router, prefix="/climate-risk", tags=["climate-risk"])
api_router.include_router(trade.router, prefix="/trade-risk", tags=["trade-risk"])
api_router.include_router(spillover.router, prefix="/spillover", tags=["spillover"])
api_router.include_router(disruptions.router, prefix="/disruptions", tags=["disruptions"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
