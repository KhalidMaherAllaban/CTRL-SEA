"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import mapboxgl from "mapbox-gl";
import { AlertTriangle, Anchor, Clock, Filter, Pause, Play, Radar, Route, Search, Ship, Waves } from "lucide-react";
import type { Chokepoint, MapLayers, Port, TradeFlow, VesselPosition } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { formatUsd } from "@/lib/utils";

const layerDefs = [
  { id: "ports", label: "Ports", icon: Anchor },
  { id: "density", label: "Density", icon: Radar },
  { id: "flows", label: "Flows", icon: Route },
  { id: "vessels", label: "Vessels", icon: Ship },
  { id: "chokepoints", label: "Chokepoints", icon: Waves },
  { id: "risk", label: "Risk", icon: AlertTriangle },
] as const;

type LayerId = (typeof layerDefs)[number]["id"];
type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;

const layerIdsByControl: Record<LayerId, string[]> = {
  ports: ["ports-cluster", "ports-count", "ports-circle", "ports-label"],
  density: ["vessel-density", "congestion-zone"],
  flows: ["trade-flow-shadow", "trade-flow-line", "trade-flow-pulse"],
  vessels: ["vessel-position", "vessel-halo"],
  chokepoints: ["chokepoints-halo", "chokepoints-circle", "chokepoints-label"],
  risk: ["risk-heatmap"],
};

function hasUsableMapboxToken(token: string | undefined): token is string {
  return Boolean(token && token.startsWith("pk.") && token !== "replace-with-mapbox-token");
}

function toMapPosition(longitude: number, latitude: number) {
  return { left: `${((longitude + 180) / 360) * 100}%`, top: `${((90 - latitude) / 180) * 100}%` };
}

function routeArc(flow: TradeFlow, segments = 56) {
  const coordinates: number[][] = [];
  let deltaLon = flow.destination_lon - flow.origin_lon;
  if (Math.abs(deltaLon) > 180) deltaLon += deltaLon > 0 ? -360 : 360;
  const bend = Math.min(18, Math.max(6, Math.abs(deltaLon) / 8));
  for (let index = 0; index <= segments; index += 1) {
    const t = index / segments;
    const lon = flow.origin_lon + deltaLon * t;
    const lat = flow.origin_lat + (flow.destination_lat - flow.origin_lat) * t + Math.sin(Math.PI * t) * bend;
    coordinates.push([lon, lat]);
  }
  return coordinates;
}

function riskColor(score: number) {
  if (score >= 75) return "#fb7185";
  if (score >= 58) return "#D6A85F";
  return "#30D5FF";
}

export function MaritimeMap({ layers }: { layers: MapLayers }) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("Global");
  const [hour, setHour] = useState(9);
  const [playing, setPlaying] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<LayerId, boolean>>({ ports: true, density: true, flows: true, vessels: true, chokepoints: true, risk: true });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const animationRef = useRef<number | null>(null);
  const pulseRef = useRef(0);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const useMapbox = hasUsableMapboxToken(mapboxToken);

  const countries = useMemo(() => ["Global", ...layers.countries.map((item) => item.country)], [layers.countries]);
  const activeFlows = useMemo(() => {
    const base = country === "Global" ? layers.trade_flows : layers.trade_flows.filter((flow) => flow.origin_country === country || flow.destination_country === country);
    return selectedRouteId ? base.filter((flow) => flow.route_id === selectedRouteId) : base;
  }, [country, layers.trade_flows, selectedRouteId]);
  const activeRouteIds = useMemo(() => new Set(activeFlows.map((flow) => flow.route_id)), [activeFlows]);
  const activePorts = useMemo(() => {
    const flowPorts = new Set(activeFlows.flatMap((flow) => [flow.origin, flow.destination]));
    const rows = country === "Global" ? layers.ports : layers.ports.filter((port) => port.country === country || flowPorts.has(port.port_name));
    return query ? rows.filter((port) => `${port.port_name} ${port.port_code} ${port.country}`.toLowerCase().includes(query.toLowerCase())) : rows;
  }, [activeFlows, country, layers.ports, query]);
  const activeVessels = useMemo(() => layers.vessel_positions.filter((vessel) => vessel.hour === hour && activeRouteIds.has(vessel.route_id)), [activeRouteIds, hour, layers.vessel_positions]);
  const activeChokepoints = useMemo(() => {
    if (country === "Global") return layers.chokepoints;
    const codes = new Set(activeFlows.flatMap((flow) => flow.chokepoints));
    return layers.chokepoints.filter((item) => codes.has(item.chokepoint_code));
  }, [activeFlows, country, layers.chokepoints]);
  const selectedRoute = useMemo(() => layers.trade_flows.find((flow) => flow.route_id === selectedRouteId) ?? activeFlows[0], [activeFlows, layers.trade_flows, selectedRouteId]);
  const topRiskPort = useMemo(() => [...activePorts].sort((a, b) => b.risk_score - a.risk_score)[0], [activePorts]);
  const topRiskChokepoint = useMemo(() => [...activeChokepoints].sort((a, b) => b.risk_score - a.risk_score)[0], [activeChokepoints]);

  const collections = useMemo(() => buildCollections(activePorts, activeFlows, activeVessels, activeChokepoints, layers.congestion_zones), [activeChokepoints, activeFlows, activePorts, activeVessels, layers.congestion_zones]);

  const syncMapData = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    updateGeoJsonSource(map, "ports", collections.ports);
    updateGeoJsonSource(map, "routes", collections.routes);
    updateGeoJsonSource(map, "route-pulse", collections.routes);
    updateGeoJsonSource(map, "vessels", collections.vessels);
    updateGeoJsonSource(map, "chokepoints", collections.chokepoints);
    updateGeoJsonSource(map, "congestion", collections.congestion);
  }, [collections]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setHour((current) => (current + 1) % 24), 900);
    return () => window.clearInterval(timer);
  }, [playing]);

  useEffect(() => {
    if (!useMapbox || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = mapboxToken;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [28, 19],
      zoom: 1.55,
      pitch: 28,
      bearing: -8,
      projection: "globe",
      antialias: true,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "bottom-right");

    map.on("load", () => {
      map.setFog({ color: "#03152D", "high-color": "#082D56", "horizon-blend": 0.18, "space-color": "#020617", "star-intensity": 0.72 });
      addSourcesAndLayers(map, collections);
      bindMapInteractions(map);
      animateRoutePulse(map, animationRef, pulseRef);
    });

    return () => {
      const frameId = animationRef.current;
      if (frameId) cancelAnimationFrame(frameId);
      animationRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [collections, mapboxToken, useMapbox]);

  useEffect(() => {
    syncMapData();
  }, [syncMapData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    for (const [control, ids] of Object.entries(layerIdsByControl) as Array<[LayerId, string[]]>) {
      for (const id of ids) {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", enabled[control] ? "visible" : "none");
      }
    }
  }, [enabled]);

  return (
    <div className="relative min-h-[760px] overflow-hidden rounded-lg border border-cyan-300/20 bg-[#03152D] shadow-[0_28px_120px_rgba(0,0,0,.58)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_42%,rgba(48,213,255,.14),transparent_34%),radial-gradient(circle_at_76%_18%,rgba(214,168,95,.08),transparent_24%)]" />
      <CommandDeck
        query={query}
        setQuery={setQuery}
        country={country}
        setCountry={(value) => {
          setCountry(value);
          setSelectedRouteId(null);
        }}
        countries={countries}
        enabled={enabled}
        setEnabled={setEnabled}
        activePorts={activePorts}
        activeFlows={activeFlows}
        activeVessels={activeVessels}
      />
      <IntelligencePanel selectedRoute={selectedRoute} topRiskPort={topRiskPort} topRiskChokepoint={topRiskChokepoint} flows={activeFlows} setSelectedRouteId={setSelectedRouteId} selectedRouteId={selectedRouteId} />
      <PlaybackRail hour={hour} setHour={setHour} playing={playing} setPlaying={setPlaying} steps={layers.time_steps} />
      {useMapbox ? <div ref={containerRef} className="absolute inset-0" /> : <FallbackMap layers={layers} enabled={enabled} flows={activeFlows} ports={activePorts} chokepoints={activeChokepoints} vessels={activeVessels} />}
    </div>
  );
}

function buildCollections(ports: Port[], flows: TradeFlow[], vessels: VesselPosition[], chokepoints: Chokepoint[], congestionZones: MapLayers["congestion_zones"]) {
  return {
    ports: {
      type: "FeatureCollection",
      features: ports.map((port) => ({
        type: "Feature",
        properties: { name: port.port_name, code: port.port_code, country: port.country, risk: port.risk_score, vessels: port.vessel_count, congestion: port.congestion, imports: port.imports, exports: port.exports, trade: port.trade_value_usd },
        geometry: { type: "Point", coordinates: [port.longitude, port.latitude] },
      })),
    } as FeatureCollection,
    routes: {
      type: "FeatureCollection",
      features: flows.map((flow) => ({
        type: "Feature",
        properties: { id: flow.route_id, name: `${flow.origin} to ${flow.destination}`, value: flow.value, risk: flow.risk, commodity: flow.commodity, vessels: flow.vessels },
        geometry: { type: "LineString", coordinates: routeArc(flow) },
      })),
    } as FeatureCollection,
    vessels: {
      type: "FeatureCollection",
      features: vessels.map((vessel) => ({
        type: "Feature",
        properties: { name: vessel.name, type: vessel.vessel_type, route: vessel.route_id, speed: vessel.speed_knots, heading: vessel.heading, risk: vessel.risk_score },
        geometry: { type: "Point", coordinates: [vessel.longitude, vessel.latitude] },
      })),
    } as FeatureCollection,
    chokepoints: {
      type: "FeatureCollection",
      features: chokepoints.map((item) => ({
        type: "Feature",
        properties: { name: item.chokepoint_name, region: item.region, risk: item.risk_score, congestion: item.congestion, transits: item.vessel_transits, impact: item.trade_impact_usd },
        geometry: { type: "Point", coordinates: [item.longitude, item.latitude] },
      })),
    } as FeatureCollection,
    congestion: {
      type: "FeatureCollection",
      features: congestionZones.map((zone) => ({
        type: "Feature",
        properties: { name: zone.name, congestion: zone.congestion },
        geometry: { type: "Point", coordinates: [zone.longitude, zone.latitude] },
      })),
    } as FeatureCollection,
  };
}

function addSourcesAndLayers(map: mapboxgl.Map, collections: ReturnType<typeof buildCollections>) {
  map.addSource("ports", { type: "geojson", data: collections.ports, cluster: true, clusterRadius: 44, clusterMaxZoom: 5 });
  map.addSource("routes", { type: "geojson", data: collections.routes });
  map.addSource("route-pulse", { type: "geojson", data: collections.routes });
  map.addSource("vessels", { type: "geojson", data: collections.vessels });
  map.addSource("chokepoints", { type: "geojson", data: collections.chokepoints });
  map.addSource("congestion", { type: "geojson", data: collections.congestion });

  map.addLayer({ id: "risk-heatmap", type: "heatmap", source: "ports", paint: { "heatmap-weight": ["interpolate", ["linear"], ["get", "risk"], 20, 0.15, 90, 1], "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 0.55, 5, 1.25], "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 24, 5, 56], "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(3,21,45,0)", 0.26, "rgba(48,213,255,.42)", 0.62, "rgba(214,168,95,.7)", 1, "rgba(251,113,133,.86)"], "heatmap-opacity": 0.58 } });
  map.addLayer({ id: "trade-flow-shadow", type: "line", source: "routes", paint: { "line-color": "rgba(2,6,23,.88)", "line-width": ["interpolate", ["linear"], ["get", "value"], 100, 5, 450, 14], "line-opacity": 0.52, "line-blur": 2 } });
  map.addLayer({ id: "trade-flow-line", type: "line", source: "routes", paint: { "line-color": ["interpolate", ["linear"], ["get", "risk"], 35, "#30D5FF", 62, "#D6A85F", 82, "#fb7185"], "line-width": ["interpolate", ["linear"], ["get", "value"], 100, 1.6, 450, 5.4], "line-opacity": 0.68 } });
  map.addLayer({ id: "trade-flow-pulse", type: "line", source: "route-pulse", paint: { "line-color": "#E8F8FF", "line-width": ["interpolate", ["linear"], ["get", "value"], 100, 1, 450, 2.6], "line-opacity": 0.82, "line-dasharray": [0, 4, 1.2, 4] } });
  map.addLayer({ id: "vessel-density", type: "heatmap", source: "vessels", paint: { "heatmap-weight": ["interpolate", ["linear"], ["get", "risk"], 20, 0.22, 95, 1], "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 18, 5, 44], "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(2,6,23,0)", 0.32, "rgba(14,165,233,.45)", 0.75, "rgba(48,213,255,.72)", 1, "rgba(214,168,95,.82)"], "heatmap-opacity": 0.62 } });
  map.addLayer({ id: "congestion-zone", type: "circle", source: "congestion", paint: { "circle-radius": ["interpolate", ["linear"], ["get", "congestion"], 45, 18, 75, 46], "circle-color": "rgba(214,168,95,.18)", "circle-stroke-color": "#D6A85F", "circle-stroke-width": 1.3, "circle-blur": 0.25 } });
  map.addLayer({ id: "ports-cluster", type: "circle", source: "ports", filter: ["has", "point_count"], paint: { "circle-radius": ["step", ["get", "point_count"], 18, 5, 26, 10, 34], "circle-color": "rgba(48,213,255,.24)", "circle-stroke-color": "#30D5FF", "circle-stroke-width": 1.5 } });
  map.addLayer({ id: "ports-count", type: "symbol", source: "ports", filter: ["has", "point_count"], layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"], "text-size": 12 }, paint: { "text-color": "#E8F8FF" } });
  map.addLayer({ id: "ports-circle", type: "circle", source: "ports", filter: ["!", ["has", "point_count"]], paint: { "circle-radius": ["interpolate", ["linear"], ["get", "vessels"], 200, 6, 1500, 13], "circle-color": ["interpolate", ["linear"], ["get", "risk"], 35, "#30D5FF", 62, "#D6A85F", 82, "#fb7185"], "circle-stroke-color": "#E8F8FF", "circle-stroke-width": 1.2, "circle-opacity": 0.96 } });
  map.addLayer({ id: "ports-label", type: "symbol", source: "ports", filter: ["!", ["has", "point_count"]], minzoom: 3.2, layout: { "text-field": ["get", "name"], "text-size": 11, "text-offset": [0, 1.35], "text-anchor": "top" }, paint: { "text-color": "#dbeafe", "text-halo-color": "#03152D", "text-halo-width": 1.2 } });
  map.addLayer({ id: "vessel-halo", type: "circle", source: "vessels", paint: { "circle-radius": 8, "circle-color": "rgba(48,213,255,.16)", "circle-stroke-color": "rgba(48,213,255,.28)", "circle-stroke-width": 1 } });
  map.addLayer({ id: "vessel-position", type: "circle", source: "vessels", paint: { "circle-radius": 3.5, "circle-color": ["interpolate", ["linear"], ["get", "risk"], 35, "#9ff6ff", 70, "#D6A85F", 90, "#fb7185"], "circle-stroke-color": "#03152D", "circle-stroke-width": 1 } });
  map.addLayer({ id: "chokepoints-halo", type: "circle", source: "chokepoints", paint: { "circle-radius": ["interpolate", ["linear"], ["get", "risk"], 40, 18, 86, 34], "circle-color": "rgba(251,113,133,.18)", "circle-stroke-color": "rgba(251,113,133,.34)", "circle-stroke-width": 1 } });
  map.addLayer({ id: "chokepoints-circle", type: "circle", source: "chokepoints", paint: { "circle-radius": 7, "circle-color": "#fb7185", "circle-stroke-color": "#fecdd3", "circle-stroke-width": 1.5 } });
  map.addLayer({ id: "chokepoints-label", type: "symbol", source: "chokepoints", minzoom: 2.4, layout: { "text-field": ["get", "name"], "text-size": 11, "text-offset": [0, -1.35], "text-anchor": "bottom" }, paint: { "text-color": "#fecdd3", "text-halo-color": "#03152D", "text-halo-width": 1.2 } });
}

function updateGeoJsonSource(map: mapboxgl.Map, sourceId: string, data: FeatureCollection) {
  const source = map.getSource(sourceId);
  if (source && "setData" in source) source.setData(data);
}

function animateRoutePulse(map: mapboxgl.Map, animationRef: MutableRefObject<number | null>, pulseRef: MutableRefObject<number>) {
  const tick = () => {
    pulseRef.current = (pulseRef.current + 0.08) % 8;
    if (map.getLayer("trade-flow-pulse")) {
      map.setPaintProperty("trade-flow-pulse", "line-dasharray", [0, 3.4 + pulseRef.current, 1.4, Math.max(1.2, 5.5 - pulseRef.current)]);
    }
    animationRef.current = requestAnimationFrame(tick);
  };
  tick();
}

function bindMapInteractions(map: mapboxgl.Map) {
  for (const layer of ["ports-circle", "vessel-position", "chokepoints-circle", "trade-flow-line"]) {
    map.on("mouseenter", layer, () => { map.getCanvas().style.cursor = "pointer"; });
    map.on("mouseleave", layer, () => { map.getCanvas().style.cursor = ""; });
  }
  map.on("click", "ports-circle", (event) => {
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== "Point") return;
    new mapboxgl.Popup().setLngLat(feature.geometry.coordinates as [number, number]).setHTML(`<strong>${feature.properties?.name}</strong><br/>${feature.properties?.country}<br/>Activity: ${feature.properties?.vessels} vessels<br/>Congestion: ${feature.properties?.congestion}%<br/>Imports: ${feature.properties?.imports}B<br/>Exports: ${feature.properties?.exports}B<br/>Risk: ${feature.properties?.risk}`).addTo(map);
  });
  map.on("click", "vessel-position", (event) => {
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== "Point") return;
    new mapboxgl.Popup().setLngLat(feature.geometry.coordinates as [number, number]).setHTML(`<strong>${feature.properties?.name}</strong><br/>${feature.properties?.type}<br/>Route: ${feature.properties?.route}<br/>Speed: ${feature.properties?.speed} kt<br/>Risk: ${feature.properties?.risk}`).addTo(map);
  });
}

function CommandDeck({ query, setQuery, country, setCountry, countries, enabled, setEnabled, activePorts, activeFlows, activeVessels }: {
  query: string;
  setQuery: (value: string) => void;
  country: string;
  setCountry: (value: string) => void;
  countries: string[];
  enabled: Record<LayerId, boolean>;
  setEnabled: Dispatch<SetStateAction<Record<LayerId, boolean>>>;
  activePorts: Port[];
  activeFlows: TradeFlow[];
  activeVessels: VesselPosition[];
}) {
  return (
    <div className="absolute left-4 top-4 z-20 w-[min(410px,calc(100%-32px))] rounded-md border border-cyan-300/15 bg-[#03152D]/90 p-3 shadow-[0_18px_80px_rgba(0,0,0,.55)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-3 border-b border-cyan-300/10 pb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#D6A85F]">CTRL SEA Map Core</p>
          <h2 className="mt-1 text-lg font-semibold text-white">Global Maritime Intelligence</h2>
        </div>
        <div className="rounded border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200">LIVE</div>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-md border border-cyan-300/15 bg-slate-950/72 px-3">
        <Search size={15} className="text-slate-500" />
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ports, countries, UN/LOCODE" className="border-0 bg-transparent focus:ring-0" />
      </div>
      <label className="mt-3 flex items-center gap-2 rounded-md border border-cyan-300/15 bg-slate-950/72 px-3 py-2 text-sm text-slate-300">
        <Filter size={15} className="text-cyan-200" />
        <select value={country} onChange={(event) => setCountry(event.target.value)} className="w-full bg-transparent text-cyan-100 outline-none">
          {countries.map((item) => <option key={item} value={item} className="bg-[#03152D] text-white">{item}</option>)}
        </select>
      </label>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Metric label="Ports" value={activePorts.length.toString()} />
        <Metric label="Routes" value={activeFlows.length.toString()} />
        <Metric label="Vessels" value={activeVessels.length.toString()} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {layerDefs.map((layer) => {
          const Icon = layer.icon;
          return (
            <button key={layer.id} onClick={() => setEnabled((current) => ({ ...current, [layer.id]: !current[layer.id] }))} className={`flex items-center gap-2 rounded border px-2.5 py-2 text-xs transition ${enabled[layer.id] ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-100" : "border-slate-700 bg-slate-950/40 text-slate-500"}`}>
              <Icon size={14} />
              {layer.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function IntelligencePanel({ selectedRoute, topRiskPort, topRiskChokepoint, flows, setSelectedRouteId, selectedRouteId }: {
  selectedRoute?: TradeFlow;
  topRiskPort?: Port;
  topRiskChokepoint?: Chokepoint;
  flows: TradeFlow[];
  setSelectedRouteId: (id: string | null) => void;
  selectedRouteId: string | null;
}) {
  return (
    <div className="absolute right-4 top-4 z-20 hidden w-[360px] rounded-md border border-cyan-300/15 bg-[#03152D]/90 p-4 shadow-[0_18px_80px_rgba(0,0,0,.55)] backdrop-blur-xl xl:block">
      <p className="text-xs uppercase tracking-[0.22em] text-[#D6A85F]">Route Intelligence</p>
      {selectedRoute && (
        <div className="mt-3 rounded-md border border-cyan-300/10 bg-slate-950/45 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">{selectedRoute.origin} to {selectedRoute.destination}</h3>
              <p className="mt-1 text-xs text-slate-400">{selectedRoute.commodity} corridor</p>
            </div>
            <span className="rounded border px-2 py-1 text-xs" style={{ borderColor: riskColor(selectedRoute.risk), color: riskColor(selectedRoute.risk) }}>Risk {selectedRoute.risk}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric label="Value" value={`$${selectedRoute.value}B`} />
            <Metric label="Vessels" value={selectedRoute.vessels.toString()} />
            <Metric label="Flow" value="Active" />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {selectedRoute.chokepoints.map((code) => (
              <span key={code} className="rounded border border-rose-300/25 bg-rose-400/10 px-2 py-1 text-[11px] text-rose-100">{code}</span>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 grid gap-3">
        <IntelRow label="Highest-risk port" name={topRiskPort?.port_name ?? "None"} value={topRiskPort ? `Risk ${topRiskPort.risk_score}` : "--"} />
        <IntelRow label="Critical chokepoint" name={topRiskChokepoint?.chokepoint_name ?? "None"} value={topRiskChokepoint ? `Risk ${topRiskChokepoint.risk_score}` : "--"} />
      </div>
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Trade Flow Watchlist</p>
          {selectedRouteId && <button onClick={() => setSelectedRouteId(null)} className="text-xs text-cyan-200">Clear</button>}
        </div>
        <div className="max-h-64 space-y-2 overflow-auto pr-1">
          {flows.map((flow) => (
            <button key={flow.route_id} onClick={() => setSelectedRouteId(flow.route_id)} className={`w-full rounded-md border p-2 text-left transition ${selectedRouteId === flow.route_id ? "border-cyan-300/40 bg-cyan-300/15" : "border-slate-800 bg-slate-950/35 hover:border-cyan-300/25"}`}>
              <div className="flex justify-between gap-3 text-sm">
                <span className="truncate text-white">{flow.origin} to {flow.destination}</span>
                <span style={{ color: riskColor(flow.risk) }}>{flow.risk}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{flow.commodity} · {formatUsd(flow.value * 1_000_000_000)}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaybackRail({ hour, setHour, playing, setPlaying, steps }: { hour: number; setHour: (value: number) => void; playing: boolean; setPlaying: (value: boolean) => void; steps: Array<{ hour: number; label: string }> }) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-20 rounded-md border border-cyan-300/15 bg-[#03152D]/90 p-3 shadow-[0_18px_80px_rgba(0,0,0,.55)] backdrop-blur-xl">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <button onClick={() => setPlaying(!playing)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-cyan-300/25 bg-cyan-300/10 text-cyan-100">
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
        <div className="flex min-w-32 items-center gap-2 text-sm text-cyan-100">
          <Clock size={15} />
          {steps.find((step) => step.hour === hour)?.label ?? `${hour}:00 UTC`}
        </div>
        <input aria-label="Time slider playback" type="range" min={0} max={23} value={hour} onChange={(event) => setHour(Number(event.target.value))} className="h-2 w-full accent-cyan-300" />
        <div className="hidden w-40 justify-between text-xs text-slate-500 md:flex">
          <span>00:00</span><span>12:00</span><span>23:00</span>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-cyan-300/10 bg-slate-950/50 p-2">
      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-cyan-100">{value}</p>
    </div>
  );
}

function IntelRow({ label, name, value }: { label: string; name: string; value: string }) {
  return (
    <div className="rounded-md border border-cyan-300/10 bg-slate-950/40 p-3">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="truncate text-sm font-semibold text-white">{name}</p>
        <p className="text-sm text-[#D6A85F]">{value}</p>
      </div>
    </div>
  );
}

function FallbackMap({ layers, enabled, flows, ports, chokepoints, vessels }: { layers: MapLayers; enabled: Record<LayerId, boolean>; flows: TradeFlow[]; ports: Port[]; chokepoints: Chokepoint[]; vessels: VesselPosition[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#03152D]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(48,213,255,0.20),transparent_30%),linear-gradient(90deg,rgba(48,213,255,0.08)_1px,transparent_1px),linear-gradient(rgba(48,213,255,0.08)_1px,transparent_1px)] bg-[size:100%_100%,52px_52px,52px_52px]" />
      {enabled.risk && <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_42%,rgba(251,113,133,.24),transparent_16%),radial-gradient(circle_at_45%_35%,rgba(214,168,95,.18),transparent_14%)]" />}
      {enabled.flows && <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {flows.map((flow) => {
          const start = toMapPosition(flow.origin_lon, flow.origin_lat);
          const end = toMapPosition(flow.destination_lon, flow.destination_lat);
          const sx = parseFloat(start.left);
          const sy = parseFloat(start.top);
          const ex = parseFloat(end.left);
          const ey = parseFloat(end.top);
          const cx = (sx + ex) / 2;
          const cy = Math.min(sy, ey) - 12;
          return <path key={flow.route_id} d={`M ${sx} ${sy} Q ${cx} ${cy} ${ex} ${ey}`} fill="none" stroke={riskColor(flow.risk)} strokeWidth={Math.max(0.22, flow.value / 900)} strokeDasharray="2 2" className="ctrl-sea-route-pulse" />;
        })}
      </svg>}
      {enabled.density && layers.congestion_zones.map((zone) => <div key={zone.name} className="absolute h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#D6A85F] bg-[#D6A85F]/15 blur-[1px]" style={toMapPosition(zone.longitude, zone.latitude)} />)}
      {enabled.vessels && vessels.map((vessel) => <div key={`${vessel.id}-${vessel.hour}`} className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-50 bg-cyan-200 shadow-[0_0_16px_rgba(48,213,255,.95)]" style={toMapPosition(vessel.longitude, vessel.latitude)} title={`${vessel.name}: ${vessel.speed_knots} kt`} />)}
      {enabled.ports && ports.map((port) => <div key={port.port_key} className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-100 shadow-[0_0_18px_rgba(48,213,255,0.85)]" style={{ ...toMapPosition(port.longitude, port.latitude), backgroundColor: riskColor(port.risk_score) }} title={`${port.port_name}: risk ${port.risk_score}, vessels ${port.vessel_count}`} />)}
      {enabled.chokepoints && chokepoints.map((item) => <div key={item.chokepoint_key} className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-rose-100 bg-rose-400 shadow-[0_0_22px_rgba(251,113,133,0.9)]" style={toMapPosition(item.longitude, item.latitude)} title={`${item.chokepoint_name}: risk ${item.risk_score}`} />)}
      <div className="absolute bottom-24 left-1/2 max-w-md -translate-x-1/2 rounded border border-cyan-300/20 bg-slate-950/85 p-3 text-center text-sm text-cyan-100">
        Add `NEXT_PUBLIC_MAPBOX_TOKEN` for the full Mapbox globe. This tactical fallback keeps animated routes, vessels, ports, chokepoints, density, and risk visible.
      </div>
    </div>
  );
}
