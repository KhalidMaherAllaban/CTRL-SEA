"use client";

import type { MapLayers, Port, TradeFlow } from "@/lib/types";

export type GlobePort = {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  tradeVolume: number;
  riskScore: number;
  congestion: number;
};

export type GlobeRoute = {
  id: string;
  origin: GlobePort;
  destination: GlobePort;
  tradeVolume: number;
  riskScore: number;
};

export type GlobeChokepoint = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
};

export type GlobeData = {
  ports: GlobePort[];
  routes: GlobeRoute[];
  chokepoints: GlobeChokepoint[];
  source: "demo" | "live";
};

export const demoChokepoints: GlobeChokepoint[] = [
  { id: "suez", name: "Suez Canal", latitude: 30.5852, longitude: 32.2654 },
  { id: "panama", name: "Panama Canal", latitude: 9.08, longitude: -79.68 },
  { id: "bab-el-mandeb", name: "Bab el-Mandeb", latitude: 12.602, longitude: 43.334 },
  { id: "hormuz", name: "Strait of Hormuz", latitude: 26.5667, longitude: 56.25 },
  { id: "malacca", name: "Strait of Malacca", latitude: 2.2, longitude: 101.0 },
  { id: "bosporus", name: "Bosporus", latitude: 41.119, longitude: 29.075 },
];

export const demoPorts: GlobePort[] = [
  { id: "SGSIN", name: "Singapore", country: "Singapore", latitude: 1.2644, longitude: 103.8200, tradeVolume: 920, riskScore: 31, congestion: 42 },
  { id: "CNSHA", name: "Shanghai", country: "China", latitude: 31.2304, longitude: 121.4737, tradeVolume: 1120, riskScore: 44, congestion: 58 },
  { id: "NLRTM", name: "Rotterdam", country: "Netherlands", latitude: 51.9244, longitude: 4.4777, tradeVolume: 780, riskScore: 28, congestion: 36 },
  { id: "EGPSD", name: "Port Said", country: "Egypt", latitude: 31.2653, longitude: 32.3019, tradeVolume: 620, riskScore: 61, congestion: 64 },
  { id: "USLAX", name: "Los Angeles", country: "United States", latitude: 33.7405, longitude: -118.2775, tradeVolume: 690, riskScore: 52, congestion: 71 },
  { id: "AEJEA", name: "Jebel Ali", country: "United Arab Emirates", latitude: 25.0118, longitude: 55.0611, tradeVolume: 650, riskScore: 39, congestion: 45 },
  { id: "BRSSZ", name: "Santos", country: "Brazil", latitude: -23.9608, longitude: -46.3336, tradeVolume: 410, riskScore: 47, congestion: 33 },
  { id: "ZADUR", name: "Durban", country: "South Africa", latitude: -29.8688, longitude: 31.0610, tradeVolume: 360, riskScore: 55, congestion: 49 },
];

const routePairs = [
  ["CNSHA", "SGSIN"],
  ["SGSIN", "EGPSD"],
  ["EGPSD", "NLRTM"],
  ["NLRTM", "USLAX"],
  ["AEJEA", "EGPSD"],
  ["BRSSZ", "NLRTM"],
  ["ZADUR", "SGSIN"],
  ["USLAX", "CNSHA"],
];

export const demoGlobeData: GlobeData = {
  ports: demoPorts,
  routes: routePairs.map(([originId, destinationId], index) => {
    const origin = demoPorts.find((port) => port.id === originId)!;
    const destination = demoPorts.find((port) => port.id === destinationId)!;
    return {
      id: `${originId}-${destinationId}`,
      origin,
      destination,
      tradeVolume: Math.round((origin.tradeVolume + destination.tradeVolume) / 2),
      riskScore: Math.round((origin.riskScore + destination.riskScore) / 2 + index),
    };
  }),
  chokepoints: demoChokepoints,
  source: "demo",
};

function validCoordinate(latitude?: number, longitude?: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude!) <= 90 && Math.abs(longitude!) <= 180;
}

function normalizePort(port: Port): GlobePort | null {
  if (!validCoordinate(port.latitude, port.longitude)) return null;
  const tradeVolume = Number(port.trade_value_usd || port.capacity_teu || port.vessel_count || 0);
  const riskScore = Number(port.trade_risk ?? port.climate_risk ?? port.risk_score ?? 0);
  return {
    id: port.port_code,
    name: port.port_name,
    country: port.country ?? "Unknown",
    latitude: port.latitude,
    longitude: port.longitude,
    tradeVolume,
    riskScore,
    congestion: Number(port.congestion ?? 0),
  };
}

export function normalizeMapLayers(layers: MapLayers): GlobeData {
  const ports = layers.ports.map(normalizePort).filter((port): port is GlobePort => Boolean(port));
  const portByName = new Map(ports.map((port) => [port.name, port]));
  const routes = layers.trade_flows
    .filter((flow) => validCoordinate(flow.origin_lat, flow.origin_lon) && validCoordinate(flow.destination_lat, flow.destination_lon))
    .slice(0, 90)
    .map((flow: TradeFlow) => {
      const origin = portByName.get(flow.origin) ?? {
        id: `${flow.route_id}-origin`,
        name: flow.origin,
        country: flow.origin_country,
        latitude: flow.origin_lat,
        longitude: flow.origin_lon,
        tradeVolume: flow.value,
        riskScore: flow.risk,
        congestion: 0,
      };
      const destination = portByName.get(flow.destination) ?? {
        id: `${flow.route_id}-destination`,
        name: flow.destination,
        country: flow.destination_country,
        latitude: flow.destination_lat,
        longitude: flow.destination_lon,
        tradeVolume: flow.value,
        riskScore: flow.risk,
        congestion: 0,
      };
      return {
        id: flow.route_id,
        origin,
        destination,
        tradeVolume: Number(flow.value || 0),
        riskScore: Number(flow.risk || 0),
      };
    });

  return {
    ports: ports.slice(0, 140),
    routes,
    chokepoints: demoChokepoints,
    source: "live",
  };
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function toDegrees(value: number) {
  return (value * 180) / Math.PI;
}

export function greatCirclePath(origin: GlobePort, destination: GlobePort, segments = 72): number[][] {
  const lat1 = toRadians(origin.latitude);
  const lon1 = toRadians(origin.longitude);
  const lat2 = toRadians(destination.latitude);
  const lon2 = toRadians(destination.longitude);
  const delta = 2 * Math.asin(Math.sqrt(
    Math.sin((lat2 - lat1) / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2
  ));

  if (!Number.isFinite(delta) || delta === 0) return [[origin.longitude, origin.latitude], [destination.longitude, destination.latitude]];

  const points: number[][] = [];
  for (let index = 0; index <= segments; index += 1) {
    const fraction = index / segments;
    const a = Math.sin((1 - fraction) * delta) / Math.sin(delta);
    const b = Math.sin(fraction * delta) / Math.sin(delta);
    const x = a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
    const y = a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);
    points.push([toDegrees(Math.atan2(y, x)), toDegrees(Math.atan2(z, Math.sqrt(x * x + y * y)))]);
  }
  return points;
}

export function interpolatePath(path: number[][], progress: number) {
  if (path.length < 2) return path[0] ?? [0, 0];
  const scaled = Math.max(0, Math.min(0.999, progress)) * (path.length - 1);
  const index = Math.floor(scaled);
  const fraction = scaled - index;
  const current = path[index];
  const next = path[index + 1] ?? current;
  return [
    current[0] + (next[0] - current[0]) * fraction,
    current[1] + (next[1] - current[1]) * fraction,
  ];
}

export function riskColor(score: number) {
  if (score >= 75) return [239, 68, 68, 0.95];
  if (score >= 55) return [249, 115, 22, 0.95];
  if (score >= 35) return [214, 168, 95, 0.95];
  return [0, 229, 160, 0.95];
}
