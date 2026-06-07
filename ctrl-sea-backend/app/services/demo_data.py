from datetime import datetime, timedelta
from math import sin
from random import Random

rand = Random(42)

COUNTRIES = [
    {"country_key": 1, "iso3": "EGY", "country": "Egypt", "region": "Middle East & North Africa", "imports_usd": 52_400_000_000, "exports_usd": 31_700_000_000, "dependency": 72, "risk_exposure": 68},
    {"country_key": 2, "iso3": "SGP", "country": "Singapore", "region": "Southeast Asia", "imports_usd": 283_900_000_000, "exports_usd": 301_200_000_000, "dependency": 91, "risk_exposure": 48},
    {"country_key": 3, "iso3": "CHN", "country": "China", "region": "East Asia", "imports_usd": 1_182_000_000_000, "exports_usd": 1_611_000_000_000, "dependency": 63, "risk_exposure": 57},
    {"country_key": 4, "iso3": "NLD", "country": "Netherlands", "region": "Europe", "imports_usd": 312_500_000_000, "exports_usd": 344_800_000_000, "dependency": 86, "risk_exposure": 39},
    {"country_key": 5, "iso3": "USA", "country": "United States", "region": "North America", "imports_usd": 916_000_000_000, "exports_usd": 604_000_000_000, "dependency": 51, "risk_exposure": 46},
    {"country_key": 6, "iso3": "ARE", "country": "United Arab Emirates", "region": "Gulf", "imports_usd": 172_000_000_000, "exports_usd": 194_000_000_000, "dependency": 82, "risk_exposure": 55},
    {"country_key": 7, "iso3": "PAN", "country": "Panama", "region": "Central America", "imports_usd": 18_200_000_000, "exports_usd": 9_400_000_000, "dependency": 88, "risk_exposure": 61},
    {"country_key": 8, "iso3": "MYS", "country": "Malaysia", "region": "Southeast Asia", "imports_usd": 118_600_000_000, "exports_usd": 132_300_000_000, "dependency": 77, "risk_exposure": 52},
]

PORTS = [
    {"port_key": 1, "port_code": "EGALY", "port_name": "Alexandria", "country_key": 1, "country": "Egypt", "latitude": 31.2, "longitude": 29.9, "capacity_teu": 1_750_000, "port_type": "Container", "vessel_count": 284, "trade_value_usd": 4_200_000_000, "risk_score": 61, "congestion": 58, "imports": 18.4, "exports": 12.7},
    {"port_key": 2, "port_code": "SGSIN", "port_name": "Singapore", "country_key": 2, "country": "Singapore", "latitude": 1.264, "longitude": 103.84, "capacity_teu": 37_200_000, "port_type": "Transshipment", "vessel_count": 1190, "trade_value_usd": 24_600_000_000, "risk_score": 44, "congestion": 46, "imports": 84.2, "exports": 91.5},
    {"port_key": 3, "port_code": "CNSHA", "port_name": "Shanghai", "country_key": 3, "country": "China", "latitude": 31.23, "longitude": 121.49, "capacity_teu": 47_000_000, "port_type": "Container", "vessel_count": 1422, "trade_value_usd": 31_100_000_000, "risk_score": 53, "congestion": 62, "imports": 103.5, "exports": 132.8},
    {"port_key": 4, "port_code": "NLRTM", "port_name": "Rotterdam", "country_key": 4, "country": "Netherlands", "latitude": 51.95, "longitude": 4.14, "capacity_teu": 14_800_000, "port_type": "Gateway", "vessel_count": 772, "trade_value_usd": 18_200_000_000, "risk_score": 37, "congestion": 35, "imports": 62.4, "exports": 69.1},
    {"port_key": 5, "port_code": "USLAX", "port_name": "Los Angeles", "country_key": 5, "country": "United States", "latitude": 33.74, "longitude": -118.27, "capacity_teu": 9_800_000, "port_type": "Container", "vessel_count": 641, "trade_value_usd": 15_600_000_000, "risk_score": 49, "congestion": 54, "imports": 74.8, "exports": 39.2},
    {"port_key": 6, "port_code": "AEJEA", "port_name": "Jebel Ali", "country_key": 6, "country": "United Arab Emirates", "latitude": 25.01, "longitude": 55.06, "capacity_teu": 19_400_000, "port_type": "Hub", "vessel_count": 690, "trade_value_usd": 13_900_000_000, "risk_score": 42, "congestion": 41, "imports": 48.1, "exports": 63.4},
    {"port_key": 7, "port_code": "PABLB", "port_name": "Balboa", "country_key": 7, "country": "Panama", "latitude": 8.95, "longitude": -79.56, "capacity_teu": 5_000_000, "port_type": "Canal Gateway", "vessel_count": 336, "trade_value_usd": 6_800_000_000, "risk_score": 64, "congestion": 67, "imports": 17.8, "exports": 14.6},
    {"port_key": 8, "port_code": "MYPKG", "port_name": "Port Klang", "country_key": 8, "country": "Malaysia", "latitude": 3.0, "longitude": 101.4, "capacity_teu": 13_700_000, "port_type": "Container", "vessel_count": 588, "trade_value_usd": 11_900_000_000, "risk_score": 51, "congestion": 49, "imports": 39.4, "exports": 44.2},
]

CHOKEPOINTS = [
    {"chokepoint_key": 1, "chokepoint_code": "SUEZ", "chokepoint_name": "Suez Canal", "latitude": 30.58, "longitude": 32.27, "region": "Middle East", "vessel_transits": 75, "risk_score": 68, "congestion": 57, "trade_impact_usd": 9_700_000_000},
    {"chokepoint_key": 2, "chokepoint_code": "PANAMA", "chokepoint_name": "Panama Canal", "latitude": 9.08, "longitude": -79.68, "region": "Central America", "vessel_transits": 36, "risk_score": 63, "congestion": 72, "trade_impact_usd": 6_100_000_000},
    {"chokepoint_key": 3, "chokepoint_code": "HORMUZ", "chokepoint_name": "Strait of Hormuz", "latitude": 26.57, "longitude": 56.25, "region": "Gulf", "vessel_transits": 92, "risk_score": 74, "congestion": 45, "trade_impact_usd": 12_900_000_000},
    {"chokepoint_key": 4, "chokepoint_code": "BAB", "chokepoint_name": "Bab el-Mandeb", "latitude": 12.58, "longitude": 43.33, "region": "Red Sea", "vessel_transits": 58, "risk_score": 82, "congestion": 61, "trade_impact_usd": 7_800_000_000},
    {"chokepoint_key": 5, "chokepoint_code": "BOSPORUS", "chokepoint_name": "Bosporus", "latitude": 41.12, "longitude": 29.05, "region": "Black Sea", "vessel_transits": 44, "risk_score": 54, "congestion": 49, "trade_impact_usd": 2_600_000_000},
    {"chokepoint_key": 6, "chokepoint_code": "MALACCA", "chokepoint_name": "Strait of Malacca", "latitude": 2.52, "longitude": 101.0, "region": "Southeast Asia", "vessel_transits": 210, "risk_score": 59, "congestion": 52, "trade_impact_usd": 15_300_000_000},
    {"chokepoint_key": 7, "chokepoint_code": "GIBRALTAR", "chokepoint_name": "Gibraltar Strait", "latitude": 35.96, "longitude": -5.75, "region": "Mediterranean", "vessel_transits": 101, "risk_score": 46, "congestion": 38, "trade_impact_usd": 5_900_000_000},
]

TRADE_FLOWS = [
    {"route_id": "CNSHA-SGSIN", "origin": "Shanghai", "destination": "Singapore", "origin_country": "China", "destination_country": "Singapore", "commodity": "Electronics", "chokepoints": ["MALACCA"], "origin_lon": 121.49, "origin_lat": 31.23, "destination_lon": 103.84, "destination_lat": 1.264, "value": 420, "risk": 57, "vessels": 312},
    {"route_id": "AEJEA-NLRTM", "origin": "Jebel Ali", "destination": "Rotterdam", "origin_country": "United Arab Emirates", "destination_country": "Netherlands", "commodity": "Energy", "chokepoints": ["HORMUZ", "BAB", "SUEZ", "GIBRALTAR"], "origin_lon": 55.06, "origin_lat": 25.01, "destination_lon": 4.14, "destination_lat": 51.95, "value": 315, "risk": 62, "vessels": 188},
    {"route_id": "SGSIN-USLAX", "origin": "Singapore", "destination": "Los Angeles", "origin_country": "Singapore", "destination_country": "United States", "commodity": "Consumer Goods", "chokepoints": ["MALACCA"], "origin_lon": 103.84, "origin_lat": 1.264, "destination_lon": -118.27, "destination_lat": 33.74, "value": 260, "risk": 48, "vessels": 146},
    {"route_id": "EGALY-NLRTM", "origin": "Alexandria", "destination": "Rotterdam", "origin_country": "Egypt", "destination_country": "Netherlands", "commodity": "Food", "chokepoints": ["SUEZ", "GIBRALTAR"], "origin_lon": 29.9, "origin_lat": 31.2, "destination_lon": 4.14, "destination_lat": 51.95, "value": 148, "risk": 56, "vessels": 74},
    {"route_id": "MYPKG-AEJEA", "origin": "Port Klang", "destination": "Jebel Ali", "origin_country": "Malaysia", "destination_country": "United Arab Emirates", "commodity": "Chemicals", "chokepoints": ["MALACCA", "HORMUZ"], "origin_lon": 101.4, "origin_lat": 3.0, "destination_lon": 55.06, "destination_lat": 25.01, "value": 184, "risk": 51, "vessels": 121},
    {"route_id": "PABLB-USLAX", "origin": "Balboa", "destination": "Los Angeles", "origin_country": "Panama", "destination_country": "United States", "commodity": "Automotive", "chokepoints": ["PANAMA"], "origin_lon": -79.56, "origin_lat": 8.95, "destination_lon": -118.27, "destination_lat": 33.74, "value": 126, "risk": 64, "vessels": 93},
]



def interpolate_route(flow: dict, progress: float) -> tuple[float, float]:
    bend = 10 if flow["destination_lon"] > flow["origin_lon"] else -10
    lon = flow["origin_lon"] + (flow["destination_lon"] - flow["origin_lon"]) * progress
    lat = flow["origin_lat"] + (flow["destination_lat"] - flow["origin_lat"]) * progress + sin(progress * 3.14159) * bend
    return round(lon, 4), round(lat, 4)


def vessel_positions_payload() -> list[dict]:
    vessel_types = ["Container", "Tanker", "Bulk Carrier", "LNG", "RoRo"]
    rows = []
    for hour in range(24):
        for index, flow in enumerate(TRADE_FLOWS):
            for vessel_idx in range(4):
                progress = ((hour * 0.035) + (vessel_idx * 0.19) + (index * 0.07)) % 1
                lon, lat = interpolate_route(flow, progress)
                rows.append(
                    {
                        "id": f"{flow['route_id']}-{vessel_idx}",
                        "name": f"CTRL {flow['commodity'].split()[0].upper()} {index + 1}{vessel_idx}",
                        "route_id": flow["route_id"],
                        "vessel_type": vessel_types[(index + vessel_idx) % len(vessel_types)],
                        "longitude": lon,
                        "latitude": lat,
                        "speed_knots": round(12 + rand.uniform(0, 9), 1),
                        "heading": round((progress * 360 + index * 18) % 360, 1),
                        "risk_score": min(96, max(22, flow["risk"] + rand.randint(-8, 10))),
                        "hour": hour,
                    }
                )
    return rows


def trend(length: int = 12, base: float = 60, volatility: float = 12, key: str = "month") -> list[dict]:
    today = datetime.utcnow().date().replace(day=1)
    rows = []
    for idx in range(length):
        value = base + sin(idx / 1.8) * volatility + rand.uniform(-4, 4)
        rows.append({key: (today - timedelta(days=30 * (length - idx - 1))).strftime("%b"), "value": round(value, 2)})
    return rows


def sparkline(base: float) -> list[float]:
    return [round(base + sin(idx / 1.5) * 4 + rand.uniform(-1.8, 1.8), 1) for idx in range(10)]


def dashboard_payload() -> dict:
    active_vessels = sum(port["vessel_count"] for port in PORTS)
    trade_value = sum(port["trade_value_usd"] for port in PORTS)
    avg_congestion = round(sum(port["congestion"] for port in PORTS) / len(PORTS), 1)
    avg_risk = round(sum(port["risk_score"] for port in PORTS) / len(PORTS), 1)
    return {
        "kpis": [
            {"label": "Active Ports", "value": 812, "change": 2.4, "weekly_change": 5.8, "tone": "cyan", "tooltip": "Ports with observed commercial activity in the current intelligence window.", "sparkline": sparkline(812)},
            {"label": "Active Vessels", "value": active_vessels, "change": 1.7, "weekly_change": 4.2, "tone": "blue", "tooltip": "AIS-observed vessels aggregated across monitored ports and corridors.", "sparkline": sparkline(active_vessels / 100)},
            {"label": "Global Trade Volume", "value": 1.92, "suffix": "B tons", "change": 3.1, "weekly_change": 6.4, "tone": "emerald", "tooltip": "Estimated seaborne import and export tonnage.", "sparkline": sparkline(72)},
            {"label": "Estimated Cargo Value", "value": round(trade_value / 1_000_000_000, 1), "suffix": "B", "prefix": "$", "change": 2.8, "weekly_change": 5.1, "tone": "gold", "tooltip": "Cargo value inferred from port throughput and country trade weights.", "sparkline": sparkline(68)},
            {"label": "Active Disruptions", "value": 37, "change": 11.5, "weekly_change": 18.2, "tone": "rose", "tooltip": "Weather, congestion, conflict, labor, and geopolitical events currently monitored.", "sparkline": sparkline(37)},
            {"label": "Chokepoint Risk Score", "value": 64.3, "change": -1.4, "weekly_change": 3.6, "tone": "amber", "tooltip": "Composite risk for strategic maritime corridors.", "sparkline": sparkline(64)},
            {"label": "Average Port Congestion", "value": avg_congestion, "suffix": "%", "change": 4.9, "weekly_change": 7.3, "tone": "violet", "tooltip": "Average queue, wait-time, and throughput pressure across active ports.", "sparkline": sparkline(avg_congestion)},
            {"label": "Global Maritime Risk Index", "value": avg_risk, "change": -0.8, "weekly_change": 2.9, "tone": "cyan", "tooltip": "Blended country, port, chokepoint, disruption, and climate-operational risk.", "sparkline": sparkline(avg_risk)},
        ],
        "trade_trend": trend(18, 920, 95),
        "vessel_activity_trend": trend(18, 6100, 520),
        "congestion_trend": trend(18, avg_congestion, 9),
        "risk_trend": trend(18, 58, 10),
        "risk_heatmap": [{"country": row["country"], "region": row["region"], "risk": row["risk_exposure"]} for row in COUNTRIES],
        "chokepoint_status": CHOKEPOINTS,
        "trade_distribution": [
            {"name": "Energy", "value": 31},
            {"name": "Electronics", "value": 24},
            {"name": "Automotive", "value": 14},
            {"name": "Food", "value": 12},
            {"name": "Chemicals", "value": 11},
            {"name": "Textiles", "value": 8},
        ],
        "port_rankings": sorted(PORTS, key=lambda item: item["trade_value_usd"], reverse=True),
        "country_rankings": sorted(COUNTRIES, key=lambda item: item["imports_usd"] + item["exports_usd"], reverse=True),
        "disruption_mix": [
            {"name": "Weather", "value": 25},
            {"name": "Conflict", "value": 19},
            {"name": "Canal Closures", "value": 11},
            {"name": "Congestion", "value": 29},
            {"name": "Labor Strikes", "value": 8},
            {"name": "Geopolitical", "value": 8},
        ],
    }


def map_payload() -> dict:
    return {
        "ports": PORTS,
        "chokepoints": CHOKEPOINTS,
        "trade_flows": TRADE_FLOWS,
        "vessel_positions": vessel_positions_payload(),
        "countries": COUNTRIES,
        "time_steps": [{"hour": hour, "label": f"{hour:02d}:00 UTC"} for hour in range(24)],
        "disruptions": disruptions_payload()[:6],
        "congestion_zones": [{"name": p["port_name"], "latitude": p["latitude"], "longitude": p["longitude"], "congestion": p["congestion"]} for p in PORTS if p["congestion"] >= 50],
    }


def port_analytics_payload() -> dict:
    return {
        "rankings": sorted(PORTS, key=lambda row: row["trade_value_usd"], reverse=True),
        "volume": [{"name": row["port_name"], "imports": row["imports"], "exports": row["exports"], "congestion": row["congestion"]} for row in PORTS],
        "import_trend": trend(14, 78, 16),
        "export_trend": trend(14, 70, 14),
        "congestion_trend": trend(14, 51, 11),
        "performance": [{"name": row["port_name"], "score": round(100 - (row["risk_score"] * .45 + row["congestion"] * .35), 1)} for row in PORTS],
        "arrivals_departures": [{"name": row["port_name"], "arrivals": row["vessel_count"], "departures": max(0, row["vessel_count"] - rand.randint(12, 72))} for row in PORTS],
    }


def chokepoint_analytics_payload() -> dict:
    return {
        "transits": [{"name": row["chokepoint_name"], "value": row["vessel_transits"]} for row in CHOKEPOINTS],
        "risk": [{"name": row["chokepoint_name"], "risk": row["risk_score"]} for row in CHOKEPOINTS],
        "congestion": [{"name": row["chokepoint_name"], "value": row["congestion"]} for row in CHOKEPOINTS],
        "trade_impact": [{"name": row["chokepoint_name"], "value": round(row["trade_impact_usd"] / 1_000_000_000, 1)} for row in CHOKEPOINTS],
        "history": [{"month": item["month"], **{cp["chokepoint_code"]: round(cp["risk_score"] + sin(idx / 2) * 6, 1) for cp in CHOKEPOINTS[:4]}} for idx, item in enumerate(trend(12, 50, 8))],
        "items": CHOKEPOINTS,
    }


def country_analytics_payload() -> dict:
    partners = ["China", "United States", "Netherlands", "Singapore", "UAE", "Egypt"]
    return {
        "countries": COUNTRIES,
        "trade_balance": [{"country": row["country"], "imports": round(row["imports_usd"] / 1_000_000_000, 1), "exports": round(row["exports_usd"] / 1_000_000_000, 1), "balance": round((row["exports_usd"] - row["imports_usd"]) / 1_000_000_000, 1)} for row in COUNTRIES],
        "dependency": [{"country": row["country"], "value": row["dependency"]} for row in COUNTRIES],
        "risk_exposure": [{"country": row["country"], "risk": row["risk_exposure"]} for row in COUNTRIES],
        "partners": [{"country": partner, "value": rand.randint(28, 96)} for partner in partners],
        "trend": trend(16, 410, 62),
    }


def climate_payload() -> dict:
    hazards = ["Coastal flood", "Cyclone wind", "Extreme heat", "Sea level rise"]
    return {
        "scenario_comparison": [
            {"scenario": "Baseline", "assetDamage": 1.4, "risk": 42},
            {"scenario": "RCP 4.5", "assetDamage": 3.8, "risk": 61},
            {"scenario": "RCP 8.5", "assetDamage": 7.2, "risk": 78},
        ],
        "hazard_heatmap": [{"country": c["country"], "hazard": h, "risk": rand.randint(25, 92)} for c in COUNTRIES for h in hazards],
        "risk_by_country": [{"country": c["country"], "risk": rand.randint(35, 88), "damage": round(rand.uniform(0.8, 9.2), 1)} for c in COUNTRIES],
        "trend": trend(16, 48, 18),
    }


def trade_payload() -> dict:
    industries = ["Energy", "Electronics", "Automotive", "Food", "Chemicals", "Textiles"]
    return {
        "value_at_risk": [{"industry": item, "value": rand.randint(12, 92)} for item in industries],
        "downtime": [{"country": port["country"], "days": rand.randint(2, 21), "loss": rand.randint(1, 12)} for port in PORTS],
        "industry_impact": [{"name": item, "imports": rand.randint(20, 95), "exports": rand.randint(15, 90)} for item in industries],
        "trade_flows": TRADE_FLOWS,
    }


def spillover_payload(port: str, country: str, industry: str, scenario: str) -> dict:
    links = [
        {"source": port, "target": "Suez Canal", "value": 34},
        {"source": "Suez Canal", "target": "Mediterranean", "value": 28},
        {"source": "Mediterranean", "target": "Rotterdam", "value": 18},
        {"source": "Mediterranean", "target": "Jebel Ali", "value": 10},
        {"source": "Rotterdam", "target": "Germany", "value": 12},
    ]
    nodes = sorted({node for link in links for node in (link["source"], link["target"])})
    return {
        "affected_countries": [{"country": c["country"], "impact": rand.randint(32, 91)} for c in COUNTRIES[:6]],
        "trade_losses": [{"name": c["country"], "loss": rand.randint(120, 940)} for c in COUNTRIES[:6]],
        "capacity_risk": [{"name": p["port_name"], "risk": rand.randint(20, 88)} for p in PORTS],
        "supply_chain_impact": [{"industry": industry, "country": c["country"], "impact": rand.randint(22, 96)} for c in COUNTRIES[:6]],
        "transit_delays": [{"route": f"{port} to {p['port_name']}", "days": rand.randint(1, 16)} for p in PORTS[:5]],
        "sankey": {"nodes": [{"name": n} for n in nodes], "links": links},
        "network": {"nodes": [{"id": n, "group": "source" if n == port else "market"} for n in nodes], "edges": links},
        "propagation": [{"step": idx + 1, "risk": min(96, 30 + idx * 12 + rand.randint(0, 10)), "scenario": scenario, "country": country} for idx in range(6)],
    }


def disruptions_payload() -> list[dict]:
    categories = ["Weather", "Conflict", "Canal Closures", "Congestion", "Labor Strikes", "Geopolitical Risks"]
    severities = ["Moderate", "High", "Critical"]
    routes = ["Red Sea-Europe", "Gulf-Asia", "Pacific Transpacific", "Asia-Europe", "Black Sea-Med"]
    return [
        {
            "id": idx + 1,
            "event_name": f"{categories[idx % len(categories)]} pressure event {idx + 1}",
            "event_type": categories[idx % len(categories)],
            "severity": severities[idx % len(severities)],
            "started_at": datetime.utcnow() - timedelta(days=idx * 3),
            "impacted_ports": [PORTS[idx % len(PORTS)]["port_name"], PORTS[(idx + 2) % len(PORTS)]["port_name"]],
            "affected_regions": ["Middle East", "Europe"] if idx % 2 else ["Asia Pacific", "North America"],
            "affected_routes": [routes[idx % len(routes)], routes[(idx + 2) % len(routes)]],
            "affected_countries": [COUNTRIES[idx % len(COUNTRIES)]["country"], COUNTRIES[(idx + 3) % len(COUNTRIES)]["country"]],
            "impact_score": rand.randint(41, 94),
            "estimated_loss_usd": float(rand.randint(50, 780) * 1_000_000),
        }
        for idx in range(12)
    ]


def etl_architecture_payload() -> dict:
    return {
        "source": "IMF PortWatch-compatible maritime, port, chokepoint, and country trade feeds",
        "layers": [
            {"name": "Raw", "description": "Immutable source extracts, API snapshots, CSV drops, and geospatial payloads."},
            {"name": "Staging", "description": "Schema validation, geocoding normalization, deduplication, and unit conversion."},
            {"name": "Curated", "description": "Conformed dimensions for ports, countries, chokepoints, routes, vessels, and disruptions."},
            {"name": "Analytics", "description": "Aggregated KPI, risk, congestion, trade-flow, and Power BI-ready semantic tables."},
        ],
        "entities": ["Ports", "Countries", "Trade Routes", "Trade Flows", "Vessels", "Congestion", "Chokepoints", "Disruptions"],
        "jobId": "etl-portwatch-refresh",
        "status": "queued",
    }
