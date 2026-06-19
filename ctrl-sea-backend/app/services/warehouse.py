"""Optimized, read-only analytics queries for the PortWatch SQL Server warehouse."""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from threading import Lock
from time import monotonic
from typing import Any, Callable

from sqlalchemy import text
from sqlalchemy.orm import Session


def _json(value: Any) -> Any:
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, (date, datetime)):
        return value.isoformat()
    return value


def rows(db: Session, sql: str, params: dict | None = None) -> list[dict]:
    return [{key: _json(value) for key, value in row.items()} for row in db.execute(text(sql), params or {}).mappings()]


def one(db: Session, sql: str, params: dict | None = None) -> dict:
    result = rows(db, sql, params)
    return result[0] if result else {}


class TTLCache:
    def __init__(self, seconds: int = 300):
        self.seconds = seconds
        self.data: dict[str, tuple[float, Any]] = {}
        self.lock = Lock()
        self.key_locks: dict[str, Lock] = {}

    def get(self, key: str, loader: Callable[[], Any]) -> Any:
        now = monotonic()
        with self.lock:
            hit = self.data.get(key)
            if hit and now - hit[0] < self.seconds:
                return hit[1]
            key_lock = self.key_locks.setdefault(key, Lock())
        with key_lock:
            now = monotonic()
            with self.lock:
                hit = self.data.get(key)
                if hit and now - hit[0] < self.seconds:
                    return hit[1]
            value = loader()
            with self.lock:
                self.data[key] = (monotonic(), value)
            return value


cache = TTLCache()


def _kpi(label: str, value: float, tone: str, suffix: str = "", prefix: str = "") -> dict:
    return {"label": label, "value": round(value, 2), "suffix": suffix, "prefix": prefix, "change": 0, "weekly_change": 0,
            "tone": tone, "tooltip": "Computed directly from the PortWatch data warehouse.", "sparkline": [round(value, 2)]}


def dashboard(db: Session) -> dict:
    def load() -> dict:
        totals = one(db, """
          SELECT (SELECT COUNT_BIG(*) FROM portwatch_dw.dimension_Country) countries,
                 (SELECT COUNT_BIG(*) FROM portwatch_dw.dimension_Ports) ports,
                 (SELECT COUNT_BIG(*) FROM portwatch_dw.dimension_ChockPoints) chokepoints,
                 (SELECT COUNT_BIG(*) FROM portwatch_dw.fact_Disruptions) disruptions,
                 (SELECT SUM(CAST(vessel_count_total AS bigint)) FROM portwatch_dw.dimension_Ports) portcalls,
                 (SELECT SUM(trade_volume) FROM portwatch_dw.fact_Monthly_Trade) trade_volume,
                 (SELECT AVG(value) FROM portwatch_dw.Fact_Climate_Risk WHERE measure='Port downtime') climate_risk,
                 (SELECT AVG(days_downtime_at_port) FROM portwatch_dw.Fact_Trade_Risk WHERE scenario='present') trade_risk,
                 (SELECT COUNT(DISTINCT portid) FROM portwatch_dw.fact_Daily_Ports WHERE date=(SELECT MAX(date) FROM portwatch_dw.fact_Daily_Ports)) active_ports
        """)
        trend = rows(db, """SELECT TOP (18) CONVERT(char(7),date,120) month, ROUND(SUM(trade_volume),2) value
          FROM portwatch_dw.fact_Monthly_Trade GROUP BY date ORDER BY date DESC""")[::-1]
        activity = rows(db, """SELECT CONVERT(char(7),date,120) month, SUM(CAST(portcalls AS bigint)) value
          FROM portwatch_dw.fact_Daily_Ports
          WHERE date>=DATEADD(month,-17,DATEFROMPARTS(YEAR((SELECT MAX(date) FROM portwatch_dw.fact_Daily_Ports)),MONTH((SELECT MAX(date) FROM portwatch_dw.fact_Daily_Ports)),1))
          GROUP BY CONVERT(char(7),date,120) ORDER BY month""")
        congestion = rows(db, """SELECT TOP (18) CONVERT(char(10),date,120) month,
          ROUND(100.0*SUM(CAST(n_total AS float))/NULLIF(SUM(CAST(capacity AS float)),0),2) value
          FROM portwatch_dw.fact_Daily_Chockpoints GROUP BY date ORDER BY date DESC""")[::-1]
        ports = port_rankings(db, 10)
        countries = country_rankings(db, 10)
        chokepoints = chokepoint_items(db)
        risk_heatmap = rows(db, """SELECT TOP (50) c.country, COALESCE(c.official,c.country) region,
          ROUND(AVG(CAST(r.days_downtime_at_port AS float)),2) risk
          FROM portwatch_dw.Fact_Trade_Risk r JOIN portwatch_dw.dimension_Country c ON c.ISO3=r.from_ISO3
          WHERE r.scenario='present'
          GROUP BY c.country,c.official ORDER BY risk DESC""")
        mix = rows(db, """SELECT COALESCE(e.eventtype,'Unknown') name, COUNT_BIG(*) value
          FROM portwatch_dw.fact_Disruptions f LEFT JOIN portwatch_dw.dimension_Disruption_Event e ON e.eventid=f.eventid
          GROUP BY e.eventtype ORDER BY value DESC""")
        industries = rows(db, """SELECT TOP (12) industry name, ROUND(SUM(CAST(trade_value_at_risk AS float)),2) value
          FROM portwatch_dw.Fact_Trade_Risk WHERE industry IS NOT NULL AND scenario='present' GROUP BY industry ORDER BY value DESC""")
        top_route = one(db, """SELECT TOP 1 CONCAT(from_portname,' → ',to_portname) name FROM portwatch_dw.Fact_Spillover_Port ORDER BY daily_capacity_at_risk DESC""")
        label_kpi = lambda label, value, tone: {"label": label, "value": value or "N/A", "suffix": "", "prefix": "", "change": 0, "weekly_change": 0, "tone": tone, "tooltip": "Ranked from warehouse aggregates.", "sparkline": []}
        kpis = [_kpi("Total Countries", totals["countries"], "cyan"), _kpi("Total Ports", totals["ports"], "blue"),
                _kpi("Active Ports", totals["active_ports"], "emerald"), _kpi("Total Port Calls", totals["portcalls"], "gold"),
                _kpi("Total Trade Volume", totals["trade_volume"], "cyan"), _kpi("Total Disruptions", totals["disruptions"], "rose"),
                _kpi("Total Chokepoints", totals["chokepoints"], "amber"), _kpi("Avg Climate Downtime", totals["climate_risk"] or 0, "violet", " days"),
                _kpi("Avg Trade Downtime", totals["trade_risk"] or 0, "cyan", " days"),
                label_kpi("Top Port", ports[0]["port_name"] if ports else None, "blue"),
                label_kpi("Top Country", countries[0]["country"] if countries else None, "emerald"),
                label_kpi("Top Trade Route", top_route.get("name"), "gold"),
                label_kpi("Highest Congestion", chokepoints[0]["chokepoint_name"] if chokepoints else None, "rose"),
                label_kpi("Highest Risk Country", risk_heatmap[0]["country"] if risk_heatmap else None, "violet")]
        return {"kpis": kpis, "trade_trend": trend, "vessel_activity_trend": activity,
                "congestion_trend": congestion, "risk_trend": congestion, "risk_heatmap": risk_heatmap,
                "chokepoint_status": chokepoints, "trade_distribution": industries,
                "port_rankings": ports, "country_rankings": countries, "disruption_mix": mix}
    return cache.get("dashboard", load)


def port_rankings(db: Session, limit: int = 50) -> list[dict]:
    def load() -> list[dict]:
        return rows(db, """WITH activity AS (
      SELECT portid,SUM(COALESCE(portcalls,0)) vessel_count,SUM(COALESCE([import],0)+COALESCE([export],0)) trade_value_usd,
      SUM(COALESCE([import],0)) imports,SUM(COALESCE([export],0)) exports
      FROM portwatch_dw.fact_Daily_Ports WHERE date >= DATEADD(day,-30,(SELECT MAX(date) FROM portwatch_dw.fact_Daily_Ports)) GROUP BY portid
    ), climate AS (
      SELECT portid,AVG(CAST(value AS float)) risk_score FROM portwatch_dw.Fact_Climate_Risk
      WHERE measure='Port downtime' AND scenario='Present' GROUP BY portid
    ), trade AS (
      SELECT to_portid,AVG(CAST(days_downtime_at_port AS float)) trade_risk FROM portwatch_dw.Fact_Trade_Risk
      WHERE scenario='present' GROUP BY to_portid
    ) SELECT 0 port_key,p.portid port_code,p.portname port_name,0 country_key,
      CAST(p.lat AS float) latitude,CAST(p.lon AS float) longitude,p.country,p.continent port_type,
      COALESCE(a.vessel_count,0) vessel_count,COALESCE(a.trade_value_usd,0) trade_value_usd,
      COALESCE(cr.risk_score,0) risk_score,COALESCE(cr.risk_score,0) climate_risk,COALESCE(tr.trade_risk,0) trade_risk,
      CASE WHEN COALESCE(p.vessel_count_total,0)=0 THEN 0 ELSE 100.0*COALESCE(a.vessel_count,0)/(30.0*p.vessel_count_total) END congestion,
      COALESCE(a.imports,0) imports,COALESCE(a.exports,0) exports
      FROM portwatch_dw.dimension_Ports p LEFT JOIN activity a ON a.portid=p.portid LEFT JOIN climate cr ON cr.portid=p.portid
      LEFT JOIN trade tr ON tr.to_portid=p.portid
      ORDER BY vessel_count DESC""")
    return cache.get("port_rankings_all", load)[:limit]


def list_ports(db: Session, search: str | None, country: str | None, page: int, size: int) -> tuple[list[dict], int]:
    where = ["1=1"]
    params: dict[str, Any] = {"offset": (page - 1) * size, "size": size}
    if search:
        where.append("(p.portname LIKE :search OR p.portid LIKE :search)")
        params["search"] = f"%{search}%"
    if country:
        where.append("(p.country LIKE :country OR p.ISO3=:country_exact)")
        params.update(country=f"%{country}%", country_exact=country.upper())
    predicate = " AND ".join(where)
    total = one(db, f"SELECT COUNT_BIG(*) total FROM portwatch_dw.dimension_Ports p WHERE {predicate}", params)["total"]
    items = rows(db, f"""WITH activity AS (
      SELECT portid,SUM(COALESCE(portcalls,0)) vessel_count,SUM(COALESCE([import],0)+COALESCE([export],0)) trade_value_usd
      FROM portwatch_dw.fact_Daily_Ports WHERE date>=DATEADD(day,-30,(SELECT MAX(date) FROM portwatch_dw.fact_Daily_Ports)) GROUP BY portid
    ), risk AS (
      SELECT portid,AVG(CAST(value AS float)) risk_score FROM portwatch_dw.Fact_Climate_Risk
      WHERE measure='Port downtime' AND scenario='Present' GROUP BY portid
    ) SELECT 0 port_key,p.portid port_code,p.portname port_name,0 country_key,CAST(p.lat AS float) latitude,
      CAST(p.lon AS float) longitude,p.country,p.continent port_type,COALESCE(a.vessel_count,0) vessel_count,
      COALESCE(a.trade_value_usd,0) trade_value_usd,COALESCE(r.risk_score,0) risk_score
      FROM portwatch_dw.dimension_Ports p
      LEFT JOIN activity a ON a.portid=p.portid LEFT JOIN risk r ON r.portid=p.portid
      WHERE {predicate} ORDER BY p.portname OFFSET :offset ROWS FETCH NEXT :size ROWS ONLY""", params)
    return items, total


def port_detail(db: Session, portid: str) -> dict | None:
    port = one(db, """SELECT p.portid,p.portname,p.fullname,p.country,p.ISO3 iso3,p.continent,CAST(p.lat AS float) latitude,
      CAST(p.lon AS float) longitude,p.industry_top1,p.industry_top2,p.industry_top3,p.vessel_count_total
      FROM portwatch_dw.dimension_Ports p WHERE p.portid=:id""", {"id": portid})
    if not port:
        return None
    port["historical_port_calls"] = rows(db, """SELECT TOP (365) CONVERT(char(10),date,120) date,portcalls,
      [import] imports,[export] exports FROM portwatch_dw.fact_Daily_Ports WHERE portid=:id ORDER BY date DESC""", {"id": portid})[::-1]
    port["monthly_trend"] = rows(db, """SELECT CONVERT(char(7),date,120) month,SUM(portcalls) portcalls,SUM([import]+[export]) trade_volume
      FROM portwatch_dw.fact_Daily_Ports WHERE portid=:id GROUP BY CONVERT(char(7),date,120) ORDER BY month""", {"id": portid})
    port["climate_risk"] = rows(db, """SELECT scenario,measure,hazard,unit,AVG(CAST(value AS float)) value
      FROM portwatch_dw.Fact_Climate_Risk WHERE portid=:id GROUP BY scenario,measure,hazard,unit""", {"id": portid})
    port["trade_risk"] = rows(db, """SELECT scenario,industry,AVG(CAST(days_downtime_at_port AS float)) downtime,
      SUM(CAST(trade_value_at_risk AS float)) value_at_risk FROM portwatch_dw.Fact_Trade_Risk WHERE to_portid=:id
      GROUP BY scenario,industry ORDER BY value_at_risk DESC""", {"id": portid})[:50]
    port["disruptions"] = rows(db, """SELECT f.DisruptionRiskFactKey id,e.eventname,e.eventtype,f.fromdate,f.todate,f.value
      FROM portwatch_dw.fact_Disruptions f LEFT JOIN portwatch_dw.dimension_Disruption_Event e ON e.eventid=f.eventid
      WHERE f.portid=:id ORDER BY f.fromdate DESC""", {"id": portid})
    port["trade_volume_trend"] = port["monthly_trend"]
    capacity = float(port.get("vessel_count_total") or 0)
    port["congestion_trend"] = [{"month": row["month"], "value": round(100 * float(row["portcalls"] or 0) / max(1, 30 * capacity), 2)} for row in port["monthly_trend"]]
    port["country_association"] = {"iso3": port.get("iso3"), "country": port.get("country")}
    ranking = port_rankings(db, 2069)
    port["ranking"] = next((index + 1 for index, item in enumerate(ranking) if item["port_code"] == portid), None)
    return port


def port_analytics(db: Session) -> dict:
    return cache.get("port_analytics", lambda: _port_analytics(db))


def _port_analytics(db: Session) -> dict:
    rankings = port_rankings(db, 20)
    trend = rows(db, """SELECT CONVERT(char(7),date,120) month,SUM([import]) imports,SUM([export]) exports,
      SUM(portcalls) value FROM portwatch_dw.fact_Daily_Ports
      WHERE date>=DATEADD(month,-23,DATEFROMPARTS(YEAR((SELECT MAX(date) FROM portwatch_dw.fact_Daily_Ports)),MONTH((SELECT MAX(date) FROM portwatch_dw.fact_Daily_Ports)),1))
      GROUP BY CONVERT(char(7),date,120) ORDER BY month""")
    return {"rankings": rankings, "volume": rankings, "import_trend": [{"month": x["month"], "value": x["imports"]} for x in trend],
            "export_trend": [{"month": x["month"], "value": x["exports"]} for x in trend],
            "congestion_trend": [{"month": x["month"], "value": x["value"]} for x in trend],
            "performance": [{"name": x["port_name"], "score": x["vessel_count"]} for x in rankings],
            "arrivals_departures": [{"name": x["port_name"], "arrivals": x["imports"], "departures": x["exports"]} for x in rankings]}


def country_rankings(db: Session, limit: int = 50) -> list[dict]:
    def load() -> list[dict]:
        return rows(db, """WITH activity AS (
      SELECT ISO3,SUM(CAST([import] AS float)) imports_usd,SUM(CAST([export] AS float)) exports_usd
      FROM portwatch_dw.fact_Daily_Ports
      WHERE date>=DATEADD(day,-30,(SELECT MAX(date) FROM portwatch_dw.fact_Daily_Ports)) GROUP BY ISO3
    ), port_counts AS (SELECT ISO3,COUNT_BIG(*) dependency FROM portwatch_dw.dimension_Ports GROUP BY ISO3),
    risk AS (SELECT from_ISO3,AVG(CAST(days_downtime_at_port AS float)) risk_exposure
      FROM portwatch_dw.Fact_Trade_Risk WHERE scenario='present' GROUP BY from_ISO3)
      SELECT 0 country_key,c.ISO3 iso3,c.country,COALESCE(m.region,c.official) region,
      COALESCE(f.imports_usd,0) imports_usd,COALESCE(f.exports_usd,0) exports_usd,
      COALESCE(pc.dependency,0) dependency,COALESCE(r.risk_exposure,0) risk_exposure
      FROM portwatch_dw.dimension_Country c LEFT JOIN activity f ON f.ISO3=c.ISO3 LEFT JOIN port_counts pc ON pc.ISO3=c.ISO3
      LEFT JOIN risk r ON r.from_ISO3=c.ISO3
      OUTER APPLY (SELECT TOP 1 region FROM portwatch_dw.map_country_regions m WHERE m.ISO3=c.ISO3 ORDER BY region) m
      ORDER BY imports_usd+exports_usd DESC""")
    return cache.get("country_rankings_all", load)[:limit]


def country_analytics(db: Session) -> dict:
    return cache.get("country_analytics", lambda: _country_analytics(db))


def _country_analytics(db: Session) -> dict:
    countries = country_rankings(db, 50)
    trend = rows(db, """SELECT TOP (24) CONVERT(char(7),date,120) month,SUM(trade_volume) value
      FROM portwatch_dw.fact_Monthly_Trade GROUP BY date ORDER BY date DESC""")[::-1]
    return {"countries": countries,
            "trade_balance": [{"country": x["country"], "imports": x["imports_usd"], "exports": x["exports_usd"], "balance": x["exports_usd"]-x["imports_usd"]} for x in countries],
            "dependency": [{"country": x["country"], "value": x["dependency"]} for x in countries],
            "risk_exposure": [{"country": x["country"], "risk": x["risk_exposure"]} for x in countries],
            "partners": [{"country": x["country"], "value": x["imports_usd"]+x["exports_usd"]} for x in countries[:10]], "trend": trend}


def country_detail(db: Session, iso3: str) -> dict | None:
    country = one(db, "SELECT ISO3 iso3,country,official,shortname,CAST(lat AS float) latitude,CAST(lon AS float) longitude FROM portwatch_dw.dimension_Country WHERE ISO3=:id", {"id": iso3.upper()})
    if not country:
        return None
    country["ports"] = rows(db, "SELECT portid,portname,CAST(lat AS float) latitude,CAST(lon AS float) longitude FROM portwatch_dw.dimension_Ports WHERE ISO3=:id", {"id": iso3.upper()})
    country["activity"] = rows(db, """SELECT TOP (36) CONVERT(char(7),date,120) month,SUM(portcalls) portcalls,SUM([import]) imports,SUM([export]) exports
      FROM portwatch_dw.fact_Daily_Ports WHERE ISO3=:id GROUP BY CONVERT(char(7),date,120) ORDER BY month DESC""", {"id": iso3.upper()})[::-1]
    country["trade_risk"] = rows(db, """SELECT scenario,industry,AVG(CAST(days_downtime_at_port AS float)) downtime,SUM(CAST(trade_value_at_risk AS float)) value_at_risk
      FROM portwatch_dw.Fact_Trade_Risk WHERE from_ISO3=:id GROUP BY scenario,industry ORDER BY value_at_risk DESC""", {"id": iso3.upper()})[:100]
    country["spillover"] = rows(db, """SELECT TOP (100) from_country,to_country,industry,daily_import_value_at_risk,daily_export_value_at_risk
      FROM portwatch_dw.Fact_Spillover_Country WHERE from_ISO3=:id OR to_ISO3=:id ORDER BY COALESCE(daily_import_value_at_risk,0)+COALESCE(daily_export_value_at_risk,0) DESC""", {"id": iso3.upper()})
    country["climate_risk"] = rows(db, """SELECT r.scenario,r.measure,r.hazard,AVG(CAST(r.value AS float)) value FROM portwatch_dw.Fact_Climate_Risk r
      JOIN portwatch_dw.dimension_Ports p ON p.portid=r.portid WHERE p.ISO3=:id GROUP BY r.scenario,r.measure,r.hazard""", {"id": iso3.upper()})
    country["trade_volume"] = sum(float(x.get("imports") or 0) + float(x.get("exports") or 0) for x in country["activity"])
    ranking = country_rankings(db, 237)
    country["ranking"] = next((index + 1 for index, item in enumerate(ranking) if item["iso3"] == iso3.upper()), None)
    return country


def chokepoint_items(db: Session) -> list[dict]:
    return cache.get("chokepoint_items", lambda: _chokepoint_items(db))


def _chokepoint_items(db: Session) -> list[dict]:
    return rows(db, """SELECT 0 chokepoint_key,d.portid chokepoint_code,d.portname chokepoint_name,CAST(d.lat AS float) latitude,
      CAST(d.lon AS float) longitude,d.fullname region,COALESCE(x.vessel_transits,0) vessel_transits,
      COALESCE(x.congestion,0) risk_score,COALESCE(x.congestion,0) congestion,COALESCE(x.trade_impact_usd,0) trade_impact_usd
      FROM portwatch_dw.dimension_ChockPoints d OUTER APPLY (SELECT SUM(n_total) vessel_transits,SUM(capacity) trade_impact_usd,
      100.0*SUM(CAST(n_total AS float))/NULLIF(SUM(CAST(capacity AS float)),0) congestion FROM portwatch_dw.fact_Daily_Chockpoints f
      WHERE f.portid=d.portid AND f.date>=DATEADD(day,-30,(SELECT MAX(date) FROM portwatch_dw.fact_Daily_Chockpoints))) x ORDER BY vessel_transits DESC""")


def chokepoint_analytics(db: Session) -> dict:
    return cache.get("chokepoint_analytics", lambda: _chokepoint_analytics(db))


def _chokepoint_analytics(db: Session) -> dict:
    items = chokepoint_items(db)
    history = rows(db, """SELECT TOP (24) CONVERT(char(7),date,120) month,SUM(n_total) value,
      100.0*SUM(CAST(n_total AS float))/NULLIF(SUM(CAST(capacity AS float)),0) congestion
      FROM portwatch_dw.fact_Daily_Chockpoints GROUP BY CONVERT(char(7),date,120) ORDER BY month DESC""")[::-1]
    return {"transits": [{"name": x["chokepoint_name"], "value": x["vessel_transits"]} for x in items],
            "risk": [{"name": x["chokepoint_name"], "risk": x["risk_score"]} for x in items],
            "congestion": [{"name": x["chokepoint_name"], "value": x["congestion"]} for x in items],
            "trade_impact": [{"name": x["chokepoint_name"], "value": x["trade_impact_usd"]} for x in items], "history": history, "items": items}


def climate(db: Session) -> dict:
    return cache.get("climate", lambda: _climate(db))


def _climate(db: Session) -> dict:
    scenario = rows(db, """SELECT scenario,ROUND(SUM(CASE WHEN measure='Physical asset damages' THEN CAST(value AS float) ELSE 0 END),2) assetDamage,
      ROUND(AVG(CASE WHEN measure='Port downtime' THEN CAST(value AS float) END),2) risk FROM portwatch_dw.Fact_Climate_Risk GROUP BY scenario ORDER BY scenario""")
    heatmap = rows(db, """SELECT TOP (200) p.country,c.hazard,ROUND(AVG(CAST(c.value AS float)),2) risk FROM portwatch_dw.Fact_Climate_Risk c
      JOIN portwatch_dw.dimension_Ports p ON p.portid=c.portid WHERE c.measure='Port downtime' GROUP BY p.country,c.hazard ORDER BY risk DESC""")
    by_country = rows(db, """SELECT TOP (50) p.country,ROUND(AVG(CASE WHEN c.measure='Port downtime' THEN CAST(c.value AS float) END),2) risk,
      ROUND(SUM(CASE WHEN c.measure='Physical asset damages' THEN CAST(c.value AS float) ELSE 0 END),2) damage FROM portwatch_dw.Fact_Climate_Risk c
      JOIN portwatch_dw.dimension_Ports p ON p.portid=c.portid GROUP BY p.country ORDER BY damage DESC""")
    return {"scenario_comparison": scenario, "hazard_heatmap": heatmap, "risk_by_country": by_country,
            "trend": [{"month": x["scenario"], "value": x["risk"] or 0} for x in scenario]}


def trade_risk(db: Session) -> dict:
    return cache.get("trade_risk", lambda: _trade_risk(db))


def _trade_risk(db: Session) -> dict:
    industries = rows(db, """SELECT TOP (20) industry,ROUND(SUM(CAST(trade_value_at_risk AS float)),2) value
      FROM portwatch_dw.Fact_Trade_Risk WHERE scenario='present' GROUP BY industry ORDER BY value DESC""")
    downtime = rows(db, """SELECT TOP (30) c.country,ROUND(AVG(CAST(r.days_downtime_at_port AS float)),2) days,
      ROUND(SUM(CAST(r.trade_value_at_risk AS float)),2) loss FROM portwatch_dw.Fact_Trade_Risk r JOIN portwatch_dw.dimension_Country c ON c.ISO3=r.from_ISO3
      WHERE r.scenario='present' GROUP BY c.country ORDER BY loss DESC""")
    return {"value_at_risk": industries, "downtime": downtime,
            "industry_impact": [{"name": x["industry"], "imports": x["value"], "exports": x["value"]} for x in industries],
            "trade_flows": map_layers(db, route_limit=100)["trade_flows"]}


def map_layers(db: Session, route_limit: int = 300) -> dict:
    return cache.get(f"map_layers:{route_limit}", lambda: _map_layers(db, route_limit))


def _map_layers(db: Session, route_limit: int = 300) -> dict:
    ports = port_rankings(db, 2500)
    chokepoints = chokepoint_items(db)
    countries = rows(db, "SELECT 0 country_key,ISO3 iso3,country,official region,CAST(lat AS float) latitude,CAST(lon AS float) longitude,0 imports_usd,0 exports_usd,0 dependency,0 risk_exposure FROM portwatch_dw.dimension_Country WHERE lat IS NOT NULL AND lon IS NOT NULL")
    routes = rows(db, f"""SELECT TOP ({int(route_limit)}) CONCAT(f.from_portid,'-',f.to_portid) route_id,
      COALESCE(origin.portname,f.from_portname) origin,COALESCE(destination.portname,f.to_portname) destination,
      f.from_country origin_country,f.to_country destination_country,'Maritime capacity' commodity,'' chokepoints,
      CAST(f.from_lon AS float) origin_lon,CAST(f.from_lat AS float) origin_lat,CAST(f.to_lon AS float) destination_lon,CAST(f.to_lat AS float) destination_lat,
      CAST(f.daily_capacity_at_risk AS float) value,100*CAST(f.relative_capacity_at_risk AS float) risk,0 vessels
      FROM portwatch_dw.Fact_Spillover_Port f
      JOIN portwatch_dw.dimension_Ports origin ON origin.portid=f.from_portid
      JOIN portwatch_dw.dimension_Ports destination ON destination.portid=f.to_portid
      WHERE f.from_lat IS NOT NULL AND f.from_lon IS NOT NULL AND f.to_lat IS NOT NULL AND f.to_lon IS NOT NULL
      ORDER BY f.daily_capacity_at_risk DESC""")
    for route in routes:
        route["chokepoints"] = []
    disruptions = disruption_list(db, 100)
    return {"ports": ports, "chokepoints": chokepoints, "trade_flows": routes, "vessel_positions": [], "countries": countries,
            "time_steps": [], "disruptions": disruptions,
            "congestion_zones": [{"name": p["port_name"], "latitude": p["latitude"], "longitude": p["longitude"], "congestion": p.get("congestion", 0)} for p in ports if p.get("congestion", 0) >= 50]}


def disruption_list(db: Session, limit: int = 500) -> list[dict]:
    return cache.get(f"disruption_list:{limit}", lambda: _disruption_list(db, limit))


def _disruption_list(db: Session, limit: int = 500) -> list[dict]:
    result = rows(db, f"""SELECT TOP ({int(limit)}) f.DisruptionRiskFactKey id,COALESCE(e.eventname,'Unknown event') event_name,
      COALESCE(e.eventtype,'Unknown') event_type,COALESCE(e.alertlevel,e.severitytext,'Unknown') severity,
      f.fromdate started_at,p.portname,c.country,CAST(p.lat AS float) latitude,CAST(p.lon AS float) longitude,
      f.value estimated_loss_usd,COALESCE(f.n_affectedports,0) impact_score
      FROM portwatch_dw.fact_Disruptions f LEFT JOIN portwatch_dw.dimension_Disruption_Event e ON e.eventid=f.eventid
      LEFT JOIN portwatch_dw.dimension_Ports p ON p.portid=f.portid LEFT JOIN portwatch_dw.dimension_Country c ON c.ISO3=f.ISO3
      ORDER BY f.fromdate DESC""")
    for item in result:
        item["impacted_ports"] = [item.pop("portname")] if item.get("portname") else []
        item["affected_countries"] = [item.pop("country")] if item.get("country") else []
        item["affected_regions"] = item["affected_countries"]
        item["affected_routes"] = []
        item["started_at"] = item["started_at"] or "1970-01-01"
        item["estimated_loss_usd"] = item["estimated_loss_usd"] or 0
        item["impact_score"] = int(item["impact_score"] or 0)
    return result


def spillover(db: Session, port: str, country: str, industry: str, scenario: str) -> dict:
    params = {"port": port, "country": country.upper(), "industry": industry}
    links = rows(db, """SELECT TOP (100) COALESCE(from_portname,from_portid) source,COALESCE(to_portname,to_portid) target,
      CAST(COALESCE(daily_capacity_at_risk,0) AS float) value,CAST(COALESCE(average_transit_days,0) AS float) days
      FROM portwatch_dw.Fact_Spillover_Port WHERE (:port='' OR from_portid=:port OR from_portname=:port) ORDER BY daily_capacity_at_risk DESC""", params)
    countries = rows(db, """SELECT TOP (30) to_country country,CAST(COALESCE(daily_import_value_at_risk,0)+COALESCE(daily_export_value_at_risk,0) AS float) impact
      FROM portwatch_dw.Fact_Spillover_Country WHERE (:country='' OR from_ISO3=:country) AND (:industry='' OR industry=:industry)
      ORDER BY impact DESC""", params)
    nodes = sorted({str(v) for link in links for v in (link["source"], link["target"])})
    sankey_links = [{"source": x["source"], "target": x["target"], "value": x["value"]} for x in links]
    return {"affected_countries": countries, "trade_losses": [{"name": x["country"], "loss": x["impact"]} for x in countries],
            "capacity_risk": [{"name": x["target"], "risk": x["value"]} for x in links],
            "supply_chain_impact": [{"industry": industry, **x} for x in countries],
            "transit_delays": [{"route": f'{x["source"]} to {x["target"]}', "days": x["days"]} for x in links],
            "sankey": {"nodes": [{"name": x} for x in nodes], "links": sankey_links},
            "network": {"nodes": [{"id": x, "group": "warehouse"} for x in nodes], "edges": sankey_links},
            "propagation": [{"step": i+1, "risk": x["value"], "scenario": scenario, "country": country} for i, x in enumerate(links[:10])]}


def risk_center(db: Session) -> dict:
    return cache.get("risk_center", lambda: _risk_center(db))


def _risk_center(db: Session) -> dict:
    return {"climate": climate(db), "trade": trade_risk(db), "disruptions": disruption_list(db, 100),
            "top_risk_locations": rows(db, """SELECT TOP (25) p.portid,p.portname,p.country,CAST(p.lat AS float) latitude,CAST(p.lon AS float) longitude,
              AVG(CAST(r.days_downtime_at_port AS float)) risk_score FROM portwatch_dw.dimension_Ports p JOIN portwatch_dw.Fact_Trade_Risk r ON r.to_portid=p.portid
              WHERE r.scenario='present' GROUP BY p.portid,p.portname,p.country,p.lat,p.lon ORDER BY risk_score DESC""")}


def insights(db: Session) -> dict:
    return cache.get("insights", lambda: _insights(db))


def _insights(db: Session) -> dict:
    top_ports = port_rankings(db, 5)
    highest_risk_countries = sorted(country_rankings(db, 237), key=lambda item: item["risk_exposure"], reverse=True)[:5]
    corridors = rows(db, """SELECT TOP (5) from_portname origin,to_portname destination,daily_capacity_at_risk value,
      relative_capacity_at_risk risk FROM portwatch_dw.Fact_Spillover_Port ORDER BY daily_capacity_at_risk DESC""")
    highest_risk_routes = rows(db, """SELECT TOP (5) from_portname origin,to_portname destination,
      CAST(daily_capacity_at_risk AS float) value,100*CAST(relative_capacity_at_risk AS float) risk
      FROM portwatch_dw.Fact_Spillover_Port WHERE relative_capacity_at_risk IS NOT NULL
      ORDER BY relative_capacity_at_risk DESC,daily_capacity_at_risk DESC""")
    fastest_growth = rows(db, """WITH bounds AS (SELECT MAX(date) max_date FROM portwatch_dw.fact_Daily_Ports), activity AS (
      SELECT f.portid,
        SUM(CASE WHEN f.date>DATEADD(day,-30,b.max_date) THEN CAST(f.portcalls AS float) ELSE 0 END) recent_calls,
        SUM(CASE WHEN f.date<=DATEADD(day,-30,b.max_date) THEN CAST(f.portcalls AS float) ELSE 0 END) previous_calls
      FROM portwatch_dw.fact_Daily_Ports f CROSS JOIN bounds b
      WHERE f.date>DATEADD(day,-60,b.max_date) GROUP BY f.portid)
      SELECT TOP (5) p.portid port_code,p.portname port_name,p.country,a.recent_calls,a.previous_calls,
        ROUND(100.0*(a.recent_calls-a.previous_calls)/NULLIF(a.previous_calls,0),2) growth
      FROM activity a JOIN portwatch_dw.dimension_Ports p ON p.portid=a.portid
      WHERE a.previous_calls>0 ORDER BY growth DESC,recent_calls DESC""")
    spillover_effects = rows(db, """SELECT TOP (5) from_country source,to_country destination,industry,
      CAST(COALESCE(daily_import_value_at_risk,0)+COALESCE(daily_export_value_at_risk,0) AS float) impact
      FROM portwatch_dw.Fact_Spillover_Country
      ORDER BY COALESCE(daily_import_value_at_risk,0)+COALESCE(daily_export_value_at_risk,0) DESC""")
    disrupted_regions = rows(db, """SELECT TOP (5) COALESCE(c.official,c.country,'Unknown') region,
      COUNT_BIG(*) disruptions,SUM(COALESCE(f.n_affectedports,0)) affected_ports
      FROM portwatch_dw.fact_Disruptions f LEFT JOIN portwatch_dw.dimension_Country c ON c.ISO3=f.ISO3
      GROUP BY COALESCE(c.official,c.country,'Unknown') ORDER BY disruptions DESC,affected_ports DESC""")
    congested = sorted(chokepoint_items(db), key=lambda x: x["congestion"], reverse=True)[:5]
    total_calls = sum(x["vessel_count"] for x in top_ports) or 1
    narratives = [f'{x["port_name"]} contributes {100*x["vessel_count"]/total_calls:.1f}% of activity among the five busiest ports.' for x in top_ports]
    if fastest_growth:
        narratives.append(f'{fastest_growth[0]["port_name"]} recorded the strongest 30-day port-call growth at {fastest_growth[0]["growth"]:.1f}%.')
    if disrupted_regions:
        narratives.append(f'{disrupted_regions[0]["region"]} has the highest recorded disruption count ({disrupted_regions[0]["disruptions"]}).')
    return {"top_opportunities": fastest_growth, "top_risks": risk_center(db)["top_risk_locations"][:5],
            "top_growth_areas": fastest_growth, "top_congested_ports": congested, "top_trade_corridors": corridors,
            "fastest_growing_ports": fastest_growth, "highest_risk_countries": highest_risk_countries,
            "highest_risk_routes": highest_risk_routes, "most_critical_chokepoints": congested,
            "largest_spillover_effects": spillover_effects, "most_disrupted_regions": disrupted_regions,
            "narratives": narratives, "generated_from": "ITI_Graduation_PortWatch"}
