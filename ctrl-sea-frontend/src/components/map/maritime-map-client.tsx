"use client";

import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { AlertTriangle, Anchor, Filter, Globe2, Route, Search, ShieldAlert, Waves } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Chokepoint, Disruption, MapLayers, Port, TradeFlow } from "@/lib/types";

const layerDefinitions = [
  { id: "ports", label: "Ports", icon: Anchor },
  { id: "countries", label: "Countries", icon: Globe2 },
  { id: "chokepoints", label: "Chokepoints", icon: Waves },
  { id: "routes", label: "Trade Routes", icon: Route },
  { id: "risk", label: "Risk", icon: ShieldAlert },
  { id: "disruptions", label: "Disruptions", icon: AlertTriangle },
] as const;

type LayerId = (typeof layerDefinitions)[number]["id"];

function validCoordinate(latitude?: number, longitude?: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude!) <= 90 && Math.abs(longitude!) <= 180;
}

function riskColor(score = 0) {
  if (score >= 8) return "#fb7185";
  if (score >= 4) return "#D6A85F";
  return "#30D5FF";
}

function escapeHtml(value: unknown) {
  return String(value ?? "—").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}

export function MaritimeMapClient({ layers }: { layers: MapLayers }) {
  const [markerClusterReady, setMarkerClusterReady] = useState(false);
  const [markerClusterError, setMarkerClusterError] = useState(false);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("Global");
  const [enabled, setEnabled] = useState<Record<LayerId, boolean>>({ ports: true, countries: true, chokepoints: true, routes: true, risk: true, disruptions: true });

  const countries = useMemo(() => ["Global", ...Array.from(new Set(layers.countries.map((item) => item.country).filter(Boolean))).sort()], [layers.countries]);
  const ports = useMemo(() => layers.ports.filter((port) => validCoordinate(port.latitude, port.longitude))
    .filter((port) => country === "Global" || port.country === country)
    .filter((port) => !query || `${port.port_name} ${port.port_code} ${port.country}`.toLowerCase().includes(query.toLowerCase())), [country, layers.ports, query]);
  const countryPoints = useMemo(() => layers.countries.filter((item) => validCoordinate(item.latitude, item.longitude) && (country === "Global" || item.country === country)), [country, layers.countries]);
  const routes = useMemo(() => layers.trade_flows.filter((flow) => validCoordinate(flow.origin_lat, flow.origin_lon) && validCoordinate(flow.destination_lat, flow.destination_lon))
    .filter((flow) => country === "Global" || flow.origin_country === country || flow.destination_country === country), [country, layers.trade_flows]);
  const chokepoints = useMemo(() => layers.chokepoints.filter((item) => validCoordinate(item.latitude, item.longitude)), [layers.chokepoints]);
  const disruptions = useMemo(() => layers.disruptions.filter((item) => validCoordinate(item.latitude, item.longitude) && (country === "Global" || item.affected_countries.includes(country))), [country, layers.disruptions]);

  useEffect(() => {
    let active = true;
    (window as Window & { L: typeof L }).L = L;
    import("leaflet.markercluster")
      .then(() => {
        if (active) setMarkerClusterReady(true);
      })
      .catch(() => {
        if (active) setMarkerClusterError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (markerClusterError) {
    return <p className="rounded-lg border border-rose-300/25 bg-rose-400/10 p-4 text-rose-200">Unable to load the map clustering engine.</p>;
  }

  if (!markerClusterReady) {
    return <p className="text-cyan-200">Loading map clustering engine...</p>;
  }

  return (
    <div className="relative min-h-[760px] overflow-hidden rounded-lg border border-cyan-300/20 bg-[#03152D] shadow-[0_28px_120px_rgba(0,0,0,.58)]">
      <MapContainer center={[19, 28]} zoom={2} minZoom={2} maxZoom={12} preferCanvas worldCopyJump className="absolute inset-0 h-full w-full bg-[#03152D]">
        <TileLayer className="ctrl-sea-osm-tiles" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {enabled.risk && <RiskLayer ports={ports} />}
        {enabled.routes && <TradeRoutes routes={routes} />}
        {enabled.countries && <CountryLayer countries={countryPoints} />}
        {enabled.chokepoints && <ChokepointLayer chokepoints={chokepoints} />}
        {enabled.disruptions && <DisruptionLayer disruptions={disruptions} />}
        {enabled.ports && <ClusteredPorts ports={ports} />}
      </MapContainer>

      <div className="absolute left-4 top-4 z-[1000] w-[min(420px,calc(100%-32px))] rounded-md border border-cyan-300/20 bg-[#03152D]/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-cyan-300/10 pb-3">
          <div><p className="text-xs uppercase tracking-[0.22em] text-[#D6A85F]">OpenStreetMap Intelligence</p><h2 className="mt-1 text-lg font-semibold text-white">Global Maritime Operations</h2></div>
          <span className="rounded border border-emerald-300/25 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200">WAREHOUSE LIVE</span>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-md border border-cyan-300/15 bg-slate-950/75 px-3"><Search size={15} className="text-slate-500" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search 2,000+ ports" className="border-0 bg-transparent focus:ring-0" /></div>
        <label className="mt-3 flex items-center gap-2 rounded-md border border-cyan-300/15 bg-slate-950/75 px-3 py-2 text-sm"><Filter size={15} className="text-cyan-200" /><select value={country} onChange={(event) => setCountry(event.target.value)} className="w-full bg-transparent text-cyan-100 outline-none">{countries.map((item) => <option key={item} className="bg-[#03152D]" value={item}>{item}</option>)}</select></label>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs"><Metric label="Ports" value={ports.length} /><Metric label="Routes" value={routes.length} /><Metric label="Alerts" value={disruptions.length} /></div>
        <div className="mt-3 grid grid-cols-2 gap-2">{layerDefinitions.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setEnabled((current) => ({ ...current, [id]: !current[id] }))} className={`flex items-center gap-2 rounded border px-3 py-2 text-xs transition ${enabled[id] ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-100" : "border-slate-700 bg-slate-950/50 text-slate-500"}`}><Icon size={14} />{label}</button>)}</div>
      </div>
    </div>
  );
}

function ClusteredPorts({ ports }: { ports: Port[] }) {
  const map = useMap();
  useEffect(() => {
    const cluster = L.markerClusterGroup({ chunkedLoading: true, chunkInterval: 100, chunkDelay: 20, removeOutsideVisibleBounds: true, showCoverageOnHover: false, maxClusterRadius: 52, spiderfyOnMaxZoom: true });
    const markers = ports.map((port) => {
      const score = Math.max(port.trade_risk ?? 0, port.climate_risk ?? port.risk_score ?? 0);
      const size = Math.max(12, Math.min(28, 11 + Math.log10(Math.max(1, port.vessel_count)) * 4));
      const marker = L.marker([port.latitude, port.longitude], { title: port.port_name, icon: L.divIcon({ className: "ctrl-sea-port-marker", html: `<span style="width:${size}px;height:${size}px;background:${riskColor(score)}"></span>`, iconSize: [size, size], iconAnchor: [size / 2, size / 2] }) });
      marker.bindPopup(`<article class="ctrl-sea-popup"><p class="eyebrow">PORT INTELLIGENCE</p><h3>${escapeHtml(port.port_name)}</h3><dl><dt>Country</dt><dd>${escapeHtml(port.country)}</dd><dt>Port Calls</dt><dd>${Number(port.vessel_count || 0).toLocaleString()}</dd><dt>Trade Risk</dt><dd>${Number(port.trade_risk || 0).toFixed(2)} days</dd><dt>Climate Risk</dt><dd>${Number(port.climate_risk ?? port.risk_score ?? 0).toFixed(2)} days</dd></dl></article>`, { maxWidth: 300 });
      return marker;
    });
    cluster.addLayers(markers);
    map.addLayer(cluster);
    return () => { map.removeLayer(cluster); cluster.clearLayers(); };
  }, [map, ports]);
  return null;
}

function TradeRoutes({ routes }: { routes: TradeFlow[] }) {
  return <>{routes.map((route) => <Polyline className="ctrl-sea-trade-route" key={route.route_id} positions={[[route.origin_lat, route.origin_lon], [route.destination_lat, route.destination_lon]]} pathOptions={{ color: riskColor(route.risk), weight: Math.max(1, Math.min(7, 1 + Math.log10(Math.max(1, route.value)))), opacity: 0.65, dashArray: "10 12" }}><Tooltip sticky>{route.origin} → {route.destination}</Tooltip><Popup><strong>{route.origin} → {route.destination}</strong><br />Capacity at risk: {Number(route.value).toLocaleString()}<br />Risk: {Number(route.risk).toFixed(2)}</Popup></Polyline>)}</>;
}

function CountryLayer({ countries }: { countries: MapLayers["countries"] }) {
  return <>{countries.map((item) => <CircleMarker key={item.iso3} center={[item.latitude!, item.longitude!]} radius={5} pathOptions={{ color: "#93c5fd", fillColor: "#082D56", fillOpacity: 0.9, weight: 1 }}><Tooltip>{item.country}</Tooltip><Popup><strong>{item.country}</strong><br />ISO3: {item.iso3}</Popup></CircleMarker>)}</>;
}

function ChokepointLayer({ chokepoints }: { chokepoints: Chokepoint[] }) {
  return <>{chokepoints.map((item) => <CircleMarker key={item.chokepoint_code} center={[item.latitude, item.longitude]} radius={8} pathOptions={{ color: "#fecdd3", fillColor: "#fb7185", fillOpacity: 0.9, weight: 2 }}><Tooltip>{item.chokepoint_name}</Tooltip><Popup><strong>{item.chokepoint_name}</strong><br />Traffic: {Number(item.vessel_transits).toLocaleString()}<br />Congestion: {Number(item.congestion ?? 0).toFixed(2)}%</Popup></CircleMarker>)}</>;
}

function RiskLayer({ ports }: { ports: Port[] }) {
  return <>{ports.filter((port) => Math.max(port.trade_risk ?? 0, port.climate_risk ?? 0) > 0).map((port) => { const score = Math.max(port.trade_risk ?? 0, port.climate_risk ?? 0); return <CircleMarker key={`risk-${port.port_code}`} center={[port.latitude, port.longitude]} radius={Math.max(5, Math.min(22, 5 + score))} pathOptions={{ color: riskColor(score), fillColor: riskColor(score), fillOpacity: 0.12, opacity: 0.35, weight: 1 }} />; })}</>;
}

function DisruptionLayer({ disruptions }: { disruptions: Disruption[] }) {
  return <>{disruptions.map((item) => <CircleMarker key={item.id} center={[item.latitude!, item.longitude!]} radius={9} pathOptions={{ color: "#fef2f2", fillColor: "#ef4444", fillOpacity: 0.9, weight: 2 }}><Tooltip>{item.event_name}</Tooltip><Popup><strong>{item.event_name}</strong><br />Severity: {item.severity}<br />Affected ports: {item.impact_score}</Popup></CircleMarker>)}</>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded border border-cyan-300/10 bg-slate-950/55 p-2"><p className="text-slate-500">{label}</p><p className="mt-1 text-base font-semibold text-cyan-100">{value.toLocaleString()}</p></div>;
}
