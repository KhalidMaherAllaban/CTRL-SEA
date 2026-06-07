from datetime import datetime

from pydantic import BaseModel, Field


class CountryRead(BaseModel):
    country_key: int
    iso3: str
    country_name: str
    region: str | None = None
    income_group: str | None = None

    model_config = {"from_attributes": True}


class PortRead(BaseModel):
    port_key: int
    port_code: str
    port_name: str
    country_key: int
    latitude: float
    longitude: float
    capacity_teu: int | None = None
    port_type: str | None = None
    vessel_count: int = 0
    trade_value_usd: float = 0
    risk_score: float = 0

    model_config = {"from_attributes": True}


class ChokepointRead(BaseModel):
    chokepoint_key: int
    chokepoint_code: str
    chokepoint_name: str
    latitude: float
    longitude: float
    region: str | None = None
    vessel_transits: int = 0
    risk_score: float = 0

    model_config = {"from_attributes": True}


class DashboardOverview(BaseModel):
    kpis: list[dict]
    trade_trend: list[dict]
    vessel_activity_trend: list[dict]
    congestion_trend: list[dict]
    risk_trend: list[dict]
    risk_heatmap: list[dict]
    chokepoint_status: list[dict]
    trade_distribution: list[dict]
    port_rankings: list[dict]
    country_rankings: list[dict]
    disruption_mix: list[dict]


class ClimateRiskResponse(BaseModel):
    scenario_comparison: list[dict]
    hazard_heatmap: list[dict]
    risk_by_country: list[dict]
    trend: list[dict]


class TradeRiskResponse(BaseModel):
    value_at_risk: list[dict]
    downtime: list[dict]
    industry_impact: list[dict]
    trade_flows: list[dict]


class SpilloverRequest(BaseModel):
    port: str
    country: str
    industry: str
    scenario: str


class SpilloverResponse(BaseModel):
    affected_countries: list[dict]
    trade_losses: list[dict]
    capacity_risk: list[dict]
    supply_chain_impact: list[dict]
    transit_delays: list[dict]
    sankey: dict
    network: dict
    propagation: list[dict]


class DisruptionRead(BaseModel):
    id: int
    event_name: str
    event_type: str
    severity: str
    started_at: datetime
    impacted_ports: list[str]
    affected_regions: list[str]
    affected_routes: list[str] = Field(default_factory=list)
    affected_countries: list[str] = Field(default_factory=list)
    impact_score: int = 0
    estimated_loss_usd: float


class ReportRead(BaseModel):
    id: str
    title: str
    description: str
    embed_url: str
    workspace: str


class DatasetUploadResult(BaseModel):
    filename: str
    rows: int
    columns: list[str]
    preview: list[dict]
