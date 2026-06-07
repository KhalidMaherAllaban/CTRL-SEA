from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.session import Base


class Country(Base):
    __tablename__ = "DimCountry"

    country_key: Mapped[int] = mapped_column("CountryKey", Integer, primary_key=True)
    iso3: Mapped[str] = mapped_column("Iso3", String(3), unique=True, index=True)
    country_name: Mapped[str] = mapped_column("CountryName", String(120), index=True)
    region: Mapped[str | None] = mapped_column("Region", String(120))
    income_group: Mapped[str | None] = mapped_column("IncomeGroup", String(80))


class Port(Base):
    __tablename__ = "DimPort"

    port_key: Mapped[int] = mapped_column("PortKey", Integer, primary_key=True)
    port_code: Mapped[str] = mapped_column("PortCode", String(24), unique=True, index=True)
    port_name: Mapped[str] = mapped_column("PortName", String(160), index=True)
    country_key: Mapped[int] = mapped_column("CountryKey", ForeignKey("DimCountry.CountryKey"), index=True)
    latitude: Mapped[float] = mapped_column("Latitude", Float)
    longitude: Mapped[float] = mapped_column("Longitude", Float)
    capacity_teu: Mapped[int | None] = mapped_column("CapacityTeu", Integer)
    port_type: Mapped[str | None] = mapped_column("PortType", String(50))


class Chokepoint(Base):
    __tablename__ = "DimChokepoint"

    chokepoint_key: Mapped[int] = mapped_column("ChokepointKey", Integer, primary_key=True)
    chokepoint_code: Mapped[str] = mapped_column("ChokepointCode", String(40), unique=True, index=True)
    chokepoint_name: Mapped[str] = mapped_column("ChokepointName", String(160), index=True)
    latitude: Mapped[float] = mapped_column("Latitude", Float)
    longitude: Mapped[float] = mapped_column("Longitude", Float)
    region: Mapped[str | None] = mapped_column("Region", String(120))


class Scenario(Base):
    __tablename__ = "DimScenario"

    scenario_key: Mapped[int] = mapped_column("ScenarioKey", Integer, primary_key=True)
    scenario_code: Mapped[str] = mapped_column("ScenarioCode", String(40), unique=True)
    scenario_name: Mapped[str] = mapped_column("ScenarioName", String(140))
    scenario_description: Mapped[str | None] = mapped_column("ScenarioDescription", String(500))


class Industry(Base):
    __tablename__ = "DimIndustry"

    industry_key: Mapped[int] = mapped_column("IndustryKey", Integer, primary_key=True)
    industry_code: Mapped[str] = mapped_column("IndustryCode", String(40), unique=True)
    industry_name: Mapped[str] = mapped_column("IndustryName", String(160))


class DisruptionEvent(Base):
    __tablename__ = "DimDisruptionEvent"

    disruption_event_key: Mapped[int] = mapped_column("DisruptionEventKey", Integer, primary_key=True)
    event_code: Mapped[str] = mapped_column("EventCode", String(60), unique=True)
    event_name: Mapped[str] = mapped_column("EventName", String(180))
    event_type: Mapped[str] = mapped_column("EventType", String(80))
    severity: Mapped[str] = mapped_column("Severity", String(30))
    started_at: Mapped[datetime] = mapped_column("StartedAt", DateTime)
    ended_at: Mapped[datetime | None] = mapped_column("EndedAt", DateTime)


class Vessel(Base):
    __tablename__ = "DimVessel"

    vessel_key: Mapped[int] = mapped_column("VesselKey", Integer, primary_key=True)
    imo_number: Mapped[str] = mapped_column("ImoNumber", String(20), unique=True, index=True)
    vessel_name: Mapped[str] = mapped_column("VesselName", String(160), index=True)
    vessel_type: Mapped[str] = mapped_column("VesselType", String(80))
    flag_country_key: Mapped[int | None] = mapped_column("FlagCountryKey", Integer)
    deadweight_tons: Mapped[float | None] = mapped_column("DeadweightTons", Numeric(18, 2))


class TradeRoute(Base):
    __tablename__ = "DimTradeRoute"

    trade_route_key: Mapped[int] = mapped_column("TradeRouteKey", Integer, primary_key=True)
    route_code: Mapped[str] = mapped_column("RouteCode", String(60), unique=True)
    origin_port_key: Mapped[int] = mapped_column("OriginPortKey", Integer)
    destination_port_key: Mapped[int] = mapped_column("DestinationPortKey", Integer)
    primary_chokepoint_key: Mapped[int | None] = mapped_column("PrimaryChokepointKey", Integer)
    route_name: Mapped[str] = mapped_column("RouteName", String(180))


class EtlRun(Base):
    __tablename__ = "EtlRun"

    etl_run_key: Mapped[int] = mapped_column("EtlRunKey", Integer, primary_key=True)
    source_system: Mapped[str] = mapped_column("SourceSystem", String(120))
    layer_name: Mapped[str] = mapped_column("LayerName", String(40))
    status: Mapped[str] = mapped_column("Status", String(40))
    started_at: Mapped[datetime] = mapped_column("StartedAt", DateTime)
    ended_at: Mapped[datetime | None] = mapped_column("EndedAt", DateTime)


class FactDailyPort(Base):
    __tablename__ = "FactDailyPorts"

    fact_daily_port_key: Mapped[int] = mapped_column("FactDailyPortKey", Integer, primary_key=True)
    date_key: Mapped[int] = mapped_column("DateKey", Integer, index=True)
    port_key: Mapped[int] = mapped_column("PortKey", ForeignKey("DimPort.PortKey"), index=True)
    vessel_count: Mapped[int] = mapped_column("VesselCount", Integer)
    import_tonnage: Mapped[float] = mapped_column("ImportTonnage", Numeric(18, 2))
    export_tonnage: Mapped[float] = mapped_column("ExportTonnage", Numeric(18, 2))
    trade_value_usd: Mapped[float] = mapped_column("TradeValueUsd", Numeric(19, 2))
    waiting_hours: Mapped[float] = mapped_column("WaitingHours", Numeric(10, 2))
    risk_score: Mapped[float] = mapped_column("RiskScore", Numeric(5, 2))


class FactDailyCongestion(Base):
    __tablename__ = "FactDailyCongestion"

    fact_daily_congestion_key: Mapped[int] = mapped_column("FactDailyCongestionKey", Integer, primary_key=True)
    date_key: Mapped[int] = mapped_column("DateKey", Integer, index=True)
    port_key: Mapped[int] = mapped_column("PortKey", Integer, index=True)
    queue_vessels: Mapped[int] = mapped_column("QueueVessels", Integer)
    median_waiting_hours: Mapped[float] = mapped_column("MedianWaitingHours", Numeric(10, 2))
    congestion_score: Mapped[float] = mapped_column("CongestionScore", Numeric(5, 2))


class FactMonthlyTrade(Base):
    __tablename__ = "FactMonthlyTrade"

    fact_monthly_trade_key: Mapped[int] = mapped_column("FactMonthlyTradeKey", Integer, primary_key=True)
    date_key: Mapped[int] = mapped_column("DateKey", Integer, index=True)
    origin_country_key: Mapped[int] = mapped_column("OriginCountryKey", Integer)
    destination_country_key: Mapped[int] = mapped_column("DestinationCountryKey", Integer)
    industry_key: Mapped[int] = mapped_column("IndustryKey", Integer)
    commodity: Mapped[str] = mapped_column("Commodity", String(120))
    trade_value_usd: Mapped[float] = mapped_column("TradeValueUsd", Numeric(19, 2))
    trade_volume_tons: Mapped[float] = mapped_column("TradeVolumeTons", Numeric(18, 2))


class FactTradeFlow(Base):
    __tablename__ = "FactTradeFlow"

    fact_trade_flow_key: Mapped[int] = mapped_column("FactTradeFlowKey", Integer, primary_key=True)
    date_key: Mapped[int] = mapped_column("DateKey", Integer, index=True)
    trade_route_key: Mapped[int] = mapped_column("TradeRouteKey", Integer, index=True)
    vessel_key: Mapped[int | None] = mapped_column("VesselKey", Integer)
    cargo_value_usd: Mapped[float] = mapped_column("CargoValueUsd", Numeric(19, 2))
    cargo_volume_tons: Mapped[float] = mapped_column("CargoVolumeTons", Numeric(18, 2))
    risk_score: Mapped[float] = mapped_column("RiskScore", Numeric(5, 2))
