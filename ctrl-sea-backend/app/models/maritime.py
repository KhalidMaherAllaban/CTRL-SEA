"""Read-only ORM mapping for the PortWatch warehouse schema."""

from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Numeric, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.session import Base

SCHEMA = "portwatch_dw"


class DateDimension(Base):
    __tablename__ = "dimension_Date"
    __table_args__ = {"schema": SCHEMA}
    date: Mapped[date] = mapped_column(Date, primary_key=True)
    year: Mapped[int] = mapped_column(SmallInteger)
    quarter: Mapped[int] = mapped_column()
    month: Mapped[int] = mapped_column()
    day: Mapped[int] = mapped_column()


class Country(Base):
    __tablename__ = "dimension_Country"
    __table_args__ = {"schema": SCHEMA}
    iso3: Mapped[str] = mapped_column("ISO3", String(3), primary_key=True)
    country: Mapped[str | None] = mapped_column(String(150))
    official: Mapped[str | None] = mapped_column(String(200))
    shortname: Mapped[str | None] = mapped_column(String(150))
    lat: Mapped[Decimal | None] = mapped_column(Numeric(10, 6))
    lon: Mapped[Decimal | None] = mapped_column(Numeric(10, 6))
    ports: Mapped[list["Port"]] = relationship(back_populates="country_dimension")


class Port(Base):
    __tablename__ = "dimension_Ports"
    __table_args__ = {"schema": SCHEMA}
    portid: Mapped[str] = mapped_column(String(30), primary_key=True)
    portname: Mapped[str | None] = mapped_column(String(200))
    country: Mapped[str | None] = mapped_column(String(150))
    iso3: Mapped[str | None] = mapped_column("ISO3", ForeignKey(f"{SCHEMA}.dimension_Country.ISO3"))
    lat: Mapped[Decimal | None] = mapped_column(Numeric(10, 6))
    lon: Mapped[Decimal | None] = mapped_column(Numeric(10, 6))
    continent: Mapped[str | None] = mapped_column(String(100))
    fullname: Mapped[str | None] = mapped_column(String(250))
    industry_top1: Mapped[str | None] = mapped_column(String(200))
    industry_top2: Mapped[str | None] = mapped_column(String(200))
    industry_top3: Mapped[str | None] = mapped_column(String(200))
    vessel_count_total: Mapped[int | None] = mapped_column(BigInteger)
    vessel_count_container: Mapped[int | None] = mapped_column(BigInteger)
    vessel_count_dry_bulk: Mapped[int | None] = mapped_column(BigInteger)
    vessel_count_general_cargo: Mapped[int | None] = mapped_column(BigInteger)
    vessel_count_roro: Mapped[int | None] = mapped_column("vessel_count_RoRo", BigInteger)
    vessel_count_tanker: Mapped[int | None] = mapped_column(BigInteger)
    share_country_maritime_import: Mapped[Decimal | None] = mapped_column(Numeric(18, 8))
    share_country_maritime_export: Mapped[Decimal | None] = mapped_column(Numeric(18, 8))
    country_dimension: Mapped[Country | None] = relationship(back_populates="ports")


class Chokepoint(Base):
    __tablename__ = "dimension_ChockPoints"
    __table_args__ = {"schema": SCHEMA}
    portid: Mapped[str] = mapped_column(String(30), primary_key=True)
    fullname: Mapped[str | None] = mapped_column(String(250))
    industry_top1: Mapped[str | None] = mapped_column(String(200))
    industry_top2: Mapped[str | None] = mapped_column(String(200))
    industry_top3: Mapped[str | None] = mapped_column(String(200))
    lat: Mapped[Decimal | None] = mapped_column(Numeric(10, 6))
    lon: Mapped[Decimal | None] = mapped_column(Numeric(10, 6))
    portname: Mapped[str | None] = mapped_column(String(200))
    vessel_count_total: Mapped[int | None] = mapped_column(BigInteger)
    vessel_count_container: Mapped[int | None] = mapped_column(BigInteger)
    vessel_count_dry_bulk: Mapped[int | None] = mapped_column(BigInteger)
    vessel_count_general_cargo: Mapped[int | None] = mapped_column(BigInteger)
    vessel_count_roro: Mapped[int | None] = mapped_column("vessel_count_RoRo", BigInteger)
    vessel_count_tanker: Mapped[int | None] = mapped_column(BigInteger)


class DisruptionEvent(Base):
    __tablename__ = "dimension_Disruption_Event"
    __table_args__ = {"schema": SCHEMA}
    eventid: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    eventname: Mapped[str | None] = mapped_column(String(250))
    eventtype: Mapped[str | None] = mapped_column(String(50))
    severitytext: Mapped[str | None] = mapped_column(String(300))
    alertlevel: Mapped[str | None] = mapped_column(String(50))
    fromdate: Mapped[datetime | None] = mapped_column(DateTime)
    todate: Mapped[datetime | None] = mapped_column(DateTime)
    year: Mapped[int | None] = mapped_column(SmallInteger)
    htmlname: Mapped[str | None] = mapped_column(String(300))
    htmldescription: Mapped[str | None] = mapped_column(Text)


class FactClimateRisk(Base):
    __tablename__ = "Fact_Climate_Risk"
    __table_args__ = {"schema": SCHEMA}
    key: Mapped[int] = mapped_column("ClimateRiskKey", BigInteger, primary_key=True)
    portid: Mapped[str | None] = mapped_column(ForeignKey(f"{SCHEMA}.dimension_Ports.portid"))
    scenario: Mapped[str | None] = mapped_column(String(100))
    unit: Mapped[str | None] = mapped_column(String(100))
    measure: Mapped[str | None] = mapped_column(String(200))
    hazard: Mapped[str | None] = mapped_column(String(200))
    value: Mapped[Decimal | None] = mapped_column(Numeric(38, 10))
    port: Mapped[Port | None] = relationship()


class FactDailyChokepoint(Base):
    __tablename__ = "fact_Daily_Chockpoints"
    __table_args__ = {"schema": SCHEMA}
    date: Mapped[date] = mapped_column(ForeignKey(f"{SCHEMA}.dimension_Date.date"), primary_key=True)
    portid: Mapped[str] = mapped_column(ForeignKey(f"{SCHEMA}.dimension_ChockPoints.portid"), primary_key=True)
    n_total: Mapped[int | None] = mapped_column(BigInteger)
    capacity: Mapped[int | None] = mapped_column(BigInteger)
    n_cargo: Mapped[int | None] = mapped_column(BigInteger)
    n_container: Mapped[int | None] = mapped_column(BigInteger)
    n_dry_bulk: Mapped[int | None] = mapped_column(BigInteger)
    n_general_cargo: Mapped[int | None] = mapped_column(BigInteger)
    n_roro: Mapped[int | None] = mapped_column(BigInteger)
    n_tanker: Mapped[int | None] = mapped_column(BigInteger)
    capacity_cargo: Mapped[int | None] = mapped_column(BigInteger)
    capacity_container: Mapped[int | None] = mapped_column(BigInteger)
    capacity_dry_bulk: Mapped[int | None] = mapped_column(BigInteger)
    capacity_general_cargo: Mapped[int | None] = mapped_column(BigInteger)
    capacity_roro: Mapped[int | None] = mapped_column(BigInteger)
    capacity_tanker: Mapped[int | None] = mapped_column(BigInteger)
    date_dimension: Mapped[DateDimension] = relationship()
    chokepoint: Mapped[Chokepoint] = relationship()


class FactDailyPort(Base):
    __tablename__ = "fact_Daily_Ports"
    __table_args__ = {"schema": SCHEMA}
    date: Mapped[date] = mapped_column(ForeignKey(f"{SCHEMA}.dimension_Date.date"), primary_key=True)
    portid: Mapped[str] = mapped_column(ForeignKey(f"{SCHEMA}.dimension_Ports.portid"), primary_key=True)
    iso3: Mapped[str] = mapped_column("ISO3", ForeignKey(f"{SCHEMA}.dimension_Country.ISO3"), primary_key=True)
    portcalls: Mapped[int | None] = mapped_column(BigInteger)
    portcalls_general_cargo: Mapped[int | None] = mapped_column(BigInteger)
    portcalls_dry_bulk: Mapped[int | None] = mapped_column(BigInteger)
    portcalls_container: Mapped[int | None] = mapped_column(BigInteger)
    portcalls_roro: Mapped[int | None] = mapped_column(BigInteger)
    portcalls_tanker: Mapped[int | None] = mapped_column(BigInteger)
    portcalls_cargo: Mapped[int | None] = mapped_column(BigInteger)
    imports: Mapped[int | None] = mapped_column("import", BigInteger)
    exports: Mapped[int | None] = mapped_column("export", BigInteger)
    data_source: Mapped[str | None] = mapped_column("DataSource", String(100))
    date_dimension: Mapped[DateDimension] = relationship()
    port: Mapped[Port] = relationship()
    country: Mapped[Country] = relationship()


class FactDisruption(Base):
    __tablename__ = "fact_Disruptions"
    __table_args__ = {"schema": SCHEMA}
    key: Mapped[int] = mapped_column("DisruptionRiskFactKey", BigInteger, primary_key=True)
    eventid: Mapped[int | None] = mapped_column(ForeignKey(f"{SCHEMA}.dimension_Disruption_Event.eventid"))
    portid: Mapped[str | None] = mapped_column(ForeignKey(f"{SCHEMA}.dimension_Ports.portid"))
    iso3: Mapped[str | None] = mapped_column("ISO3", ForeignKey(f"{SCHEMA}.dimension_Country.ISO3"))
    scenario: Mapped[str | None] = mapped_column(String(100))
    affectedports: Mapped[str | None] = mapped_column(Text)
    n_affectedports: Mapped[int | None] = mapped_column(BigInteger)
    distance_km: Mapped[Decimal | None] = mapped_column(Numeric(18, 6))
    value: Mapped[Decimal | None] = mapped_column(Numeric(28, 6))
    portshare: Mapped[Decimal | None] = mapped_column(Numeric(18, 8))
    fromdate: Mapped[date | None] = mapped_column(ForeignKey(f"{SCHEMA}.dimension_Date.date"))
    todate: Mapped[date | None] = mapped_column(Date)
    event: Mapped[DisruptionEvent | None] = relationship()
    port: Mapped[Port | None] = relationship()
    country: Mapped[Country | None] = relationship()
    start_date: Mapped[DateDimension | None] = relationship()


class FactMonthlyTrade(Base):
    __tablename__ = "fact_Monthly_Trade"
    __table_args__ = {"schema": SCHEMA}
    date: Mapped[date] = mapped_column(ForeignKey(f"{SCHEMA}.dimension_Date.date"), primary_key=True)
    region: Mapped[str] = mapped_column(String(150), primary_key=True)
    iso3: Mapped[str | None] = mapped_column("ISO3", String(3))
    trade_value: Mapped[Decimal | None] = mapped_column(Numeric(28, 6))
    trade_volume: Mapped[Decimal | None] = mapped_column(Numeric(28, 6))
    value_import_total: Mapped[Decimal | None] = mapped_column(Numeric(28, 6))
    value_export_total: Mapped[Decimal | None] = mapped_column(Numeric(28, 6))
    volume_import_total: Mapped[Decimal | None] = mapped_column(Numeric(28, 6))
    volume_export_total: Mapped[Decimal | None] = mapped_column(Numeric(28, 6))
    date_dimension: Mapped[DateDimension] = relationship()


class FactSpilloverCountry(Base):
    __tablename__ = "Fact_Spillover_Country"
    __table_args__ = {"schema": SCHEMA}
    from_iso3: Mapped[str] = mapped_column("from_ISO3", ForeignKey(f"{SCHEMA}.dimension_Country.ISO3"), primary_key=True)
    to_iso3: Mapped[str] = mapped_column("to_ISO3", ForeignKey(f"{SCHEMA}.dimension_Country.ISO3"), primary_key=True)
    from_country: Mapped[str | None] = mapped_column(String(150))
    to_country: Mapped[str | None] = mapped_column(String(150))
    industry: Mapped[str] = mapped_column(String(200), primary_key=True)
    daily_import_value_at_risk: Mapped[Decimal | None] = mapped_column(Numeric(28, 6))
    daily_export_value_at_risk: Mapped[Decimal | None] = mapped_column(Numeric(28, 6))
    source_country: Mapped[Country] = relationship(foreign_keys=[from_iso3])
    destination_country: Mapped[Country] = relationship(foreign_keys=[to_iso3])


class FactSpilloverPort(Base):
    __tablename__ = "Fact_Spillover_Port"
    __table_args__ = {"schema": SCHEMA}
    from_portid: Mapped[str] = mapped_column(ForeignKey(f"{SCHEMA}.dimension_Ports.portid"), primary_key=True)
    to_portid: Mapped[str] = mapped_column(ForeignKey(f"{SCHEMA}.dimension_Ports.portid"), primary_key=True)
    from_portname: Mapped[str | None] = mapped_column(String(200))
    to_portname: Mapped[str | None] = mapped_column(String(200))
    from_country: Mapped[str | None] = mapped_column(String(150))
    to_country: Mapped[str | None] = mapped_column(String(150))
    from_iso3: Mapped[str | None] = mapped_column(ForeignKey(f"{SCHEMA}.dimension_Country.ISO3"))
    to_iso3: Mapped[str | None] = mapped_column(ForeignKey(f"{SCHEMA}.dimension_Country.ISO3"))
    from_lat: Mapped[Decimal | None] = mapped_column(Numeric(10, 6))
    from_lon: Mapped[Decimal | None] = mapped_column(Numeric(10, 6))
    to_lat: Mapped[Decimal | None] = mapped_column(Numeric(10, 6))
    to_lon: Mapped[Decimal | None] = mapped_column(Numeric(10, 6))
    average_transit_days: Mapped[Decimal | None] = mapped_column(Numeric(18, 6))
    daily_capacity_at_risk: Mapped[Decimal | None] = mapped_column(Numeric(28, 6))
    relative_capacity_at_risk: Mapped[Decimal | None] = mapped_column(Numeric(18, 8))
    source_port: Mapped[Port] = relationship(foreign_keys=[from_portid])
    destination_port: Mapped[Port] = relationship(foreign_keys=[to_portid])
    source_country: Mapped[Country | None] = relationship(foreign_keys=[from_iso3])
    destination_country: Mapped[Country | None] = relationship(foreign_keys=[to_iso3])


class FactSpilloverSupply(Base):
    __tablename__ = "Fact_Spillover_Supply"
    __table_args__ = {"schema": SCHEMA}
    from_portid: Mapped[str] = mapped_column(ForeignKey(f"{SCHEMA}.dimension_Ports.portid"), primary_key=True)
    to_iso3: Mapped[str] = mapped_column("to_ISO3", ForeignKey(f"{SCHEMA}.dimension_Country.ISO3"), primary_key=True)
    industry: Mapped[str] = mapped_column(String(200), primary_key=True)
    daily_consumption_at_risk: Mapped[Decimal | None] = mapped_column(Numeric(28, 6))
    daily_industryoutput_at_risk: Mapped[Decimal | None] = mapped_column(Numeric(28, 6))
    source_port: Mapped[Port] = relationship()
    destination_country: Mapped[Country] = relationship()


class FactTradeRisk(Base):
    __tablename__ = "Fact_Trade_Risk"
    __table_args__ = {"schema": SCHEMA}
    key: Mapped[int] = mapped_column("TradeRiskKey", BigInteger, primary_key=True)
    from_iso3: Mapped[str | None] = mapped_column("from_ISO3", ForeignKey(f"{SCHEMA}.dimension_Country.ISO3"))
    to_portid: Mapped[str | None] = mapped_column(ForeignKey(f"{SCHEMA}.dimension_Ports.portid"))
    scenario: Mapped[str | None] = mapped_column(String(100))
    flow: Mapped[str | None] = mapped_column(String(100))
    industry: Mapped[str | None] = mapped_column(String(200))
    days_downtime_at_port: Mapped[Decimal | None] = mapped_column(Numeric(38, 10))
    trade_value_at_risk: Mapped[Decimal | None] = mapped_column(Numeric(38, 10))
    unit: Mapped[str | None] = mapped_column(String(100))
    source_country: Mapped[Country | None] = relationship()
    destination_port: Mapped[Port | None] = relationship()
