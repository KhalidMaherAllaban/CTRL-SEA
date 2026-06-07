export type User = {
  id: number;
  email: string;
  full_name: string;
  role: "admin" | "analyst" | string;
  is_active: boolean;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
};

export type Port = {
  port_key: number;
  port_code: string;
  port_name: string;
  country_key: number;
  latitude: number;
  longitude: number;
  capacity_teu?: number;
  port_type?: string;
  vessel_count: number;
  trade_value_usd: number;
  risk_score: number;
  country?: string;
  congestion?: number;
  imports?: number;
  exports?: number;
};

export type Chokepoint = {
  chokepoint_key: number;
  chokepoint_code: string;
  chokepoint_name: string;
  latitude: number;
  longitude: number;
  region?: string;
  vessel_transits: number;
  risk_score: number;
  congestion?: number;
  trade_impact_usd?: number;
};

export type DashboardOverview = {
  kpis: Array<{ label: string; value: number | string; prefix?: string; suffix?: string; change: number; weekly_change: number; tone: string; tooltip: string; sparkline: number[] }>;
  trade_trend: Array<{ month: string; value: number }>;
  vessel_activity_trend: Array<{ month: string; value: number }>;
  congestion_trend: Array<{ month: string; value: number }>;
  risk_trend: Array<{ month: string; value: number }>;
  risk_heatmap: Array<{ country: string; region: string; risk: number }>;
  chokepoint_status: Chokepoint[];
  trade_distribution: Array<{ name: string; value: number }>;
  port_rankings: Port[];
  country_rankings: CountryMetric[];
  disruption_mix: Array<{ name: string; value: number }>;
};

export type CountryMetric = {
  country_key: number;
  iso3: string;
  country: string;
  region: string;
  imports_usd: number;
  exports_usd: number;
  dependency: number;
  risk_exposure: number;
};

export type TradeFlow = {
  route_id: string;
  origin: string;
  destination: string;
  origin_country: string;
  destination_country: string;
  commodity: string;
  chokepoints: string[];
  origin_lon: number;
  origin_lat: number;
  destination_lon: number;
  destination_lat: number;
  value: number;
  risk: number;
  vessels: number;
};

export type VesselPosition = {
  id: string;
  name: string;
  route_id: string;
  vessel_type: string;
  longitude: number;
  latitude: number;
  speed_knots: number;
  heading: number;
  risk_score: number;
  hour: number;
};

export type MapLayers = {
  ports: Port[];
  chokepoints: Chokepoint[];
  trade_flows: TradeFlow[];
  vessel_positions: VesselPosition[];
  countries: CountryMetric[];
  time_steps: Array<{ hour: number; label: string }>;
  disruptions: Disruption[];
  congestion_zones: Array<{ name: string; latitude: number; longitude: number; congestion: number }>;
};

export type AdminHealth = {
  api: string;
  latencyMs: number;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
};

export type EtlResult = {
  status: string;
  jobId: string;
  layers?: Array<{ name: string; description: string }>;
  entities?: string[];
};

export type ClimateRisk = {
  scenario_comparison: Array<{ scenario: string; assetDamage: number }>;
  hazard_heatmap: Array<{ country: string; hazard: string; risk: number }>;
  risk_by_country: Array<{ country: string; risk: number }>;
  trend: Array<{ month: string; value: number }>;
};

export type TradeRisk = {
  value_at_risk: Array<{ industry: string; value: number }>;
  downtime: Array<{ country: string; days: number }>;
  industry_impact: Array<{ industry: string; impact: number }>;
  trade_flows: TradeFlow[];
};

export type SpilloverPayload = {
  port: string;
  country: string;
  industry: string;
  scenario: string;
};

export type SpilloverResult = {
  affected_countries: Array<{ country: string; impact: number }>;
  trade_losses: Array<{ name: string; loss: number }>;
  capacity_risk: Array<{ name: string; risk: number }>;
  supply_chain_impact: Array<{ country: string; impact: number }>;
  transit_delays: Array<{ route: string; days: number }>;
  sankey: { nodes: Array<{ name: string }>; links: Array<{ source: string; target: string; value: number }> };
  network: Record<string, unknown>;
  propagation: Array<{ step: number; risk: number }>;
};

export type Disruption = {
  id: number;
  event_name: string;
  event_type: string;
  severity: string;
  started_at: string;
  impacted_ports: string[];
  affected_regions: string[];
  affected_routes: string[];
  affected_countries: string[];
  impact_score: number;
  estimated_loss_usd: number;
};

export type Report = {
  id: string;
  title: string;
  description: string;
  embed_url: string;
  workspace: string;
};

export type CountryAnalytics = {
  countries: CountryMetric[];
  trade_balance: Array<{ country: string; imports: number; exports: number; balance: number }>;
  dependency: Array<{ country: string; value: number }>;
  risk_exposure: Array<{ country: string; risk: number }>;
  partners: Array<{ country: string; value: number }>;
  trend: Array<{ month: string; value: number }>;
};
