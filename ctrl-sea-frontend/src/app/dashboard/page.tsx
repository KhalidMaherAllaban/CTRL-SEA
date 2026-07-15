"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Network, RadioTower, Search, ShieldAlert, TrendingUp, X } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { InsightCard } from "@/components/dashboard/insight-card";
import { SectionHeader } from "@/components/dashboard/page-header";
import { CommandCenterHeader, type CommandAlert } from "@/components/dashboard/command-center-header";
import { GlobalFilters, defaultDashboardFilters, type DashboardFilters } from "@/components/dashboard/global-filters";
import { NotificationCenter, RealtimeStatusStrip } from "@/components/dashboard/notification-center";
import { AreaPanel, BarPanel, GaugeCard, HeatmapPanel, LinePanel, PiePanel, TreemapPanel } from "@/components/charts/analytics-charts";
import { DataTable, type DataColumn } from "@/components/ui/data-table";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { endpoints } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { CountryMetric, Port } from "@/lib/types";
import { formatMetric, formatNumber } from "@/lib/utils";

const periodByRange: Record<string, number> = { "6M": 6, "12M": 12, "18M": 18 };

function unique(values: Array<string | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort();
}

function riskMatches(value: number, level: string) {
  if (level === "Critical") return value >= 70;
  if (level === "Warning") return value >= 40 && value < 70;
  if (level === "Healthy") return value < 40;
  return true;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<DashboardFilters>(defaultDashboardFilters);
  const [activeKpi, setActiveKpi] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: endpoints.dashboard, refetchInterval: 60_000 });
  const insights = useQuery({ queryKey: ["insights"], queryFn: endpoints.insights, refetchInterval: 60_000 });
  const health = useQuery({ queryKey: ["health"], queryFn: endpoints.health, refetchInterval: 60_000 });
  const data = dashboard.data;
  const period = periodByRange[filters.dateRange] ?? 12;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filterOptions = useMemo(() => ({
    regions: unique(data?.country_rankings.map((item) => item.region) ?? []),
    countries: unique(data?.country_rankings.map((item) => item.country) ?? []),
    ports: unique(data?.port_rankings.map((item) => item.port_name) ?? []),
    cargoTypes: unique(data?.trade_distribution.map((item) => item.name) ?? []),
    shipTypes: ["Container", "Bulk", "Tanker", "General Cargo"],
    tradeRoutes: unique(insights.data?.top_trade_corridors.map((item) => `${item.origin} to ${item.destination}`) ?? [])
  }), [data, insights.data]);

  const filteredCountries = useMemo(() => (data?.country_rankings ?? [])
    .filter((row) => filters.region === "All" || row.region === filters.region)
    .filter((row) => filters.country === "All" || row.country === filters.country)
    .filter((row) => riskMatches(row.risk_exposure, filters.riskLevel)), [data, filters.country, filters.region, filters.riskLevel]);

  const filteredPorts = useMemo(() => (data?.port_rankings ?? [])
    .filter((row) => filters.country === "All" || row.country === filters.country)
    .filter((row) => filters.port === "All" || row.port_name === filters.port)
    .filter((row) => riskMatches(row.risk_score, filters.riskLevel)), [data, filters.country, filters.port, filters.riskLevel]);

  const tradeTrend = useMemo(() => data?.trade_trend.slice(-period) ?? [], [data, period]);
  const tradeDistribution = useMemo(() => (data?.trade_distribution ?? []).filter((item) => filters.cargoType === "All" || item.name === filters.cargoType), [data, filters.cargoType]);
  const topCountries = useMemo(() => filteredCountries.map((row) => ({ name: row.iso3, value: row.imports_usd + row.exports_usd })), [filteredCountries]);
  const topPorts = useMemo(() => filteredPorts.map((row) => ({ name: row.port_name, value: row.trade_value_usd })), [filteredPorts]);

  const alerts = useMemo<CommandAlert[]>(() => {
    const next: CommandAlert[] = [];
    if (health.error) next.push({ id: "api-offline", label: "API offline", tone: "critical", detail: "FastAPI health endpoint is not responding." });
    if (health.data?.database && health.data.database !== "connected") next.push({ id: "db-warning", label: "Warehouse failure", tone: "critical", detail: `Database status: ${health.data.database}` });
    const congestion = data?.congestion_trend.at(-1)?.value ?? 0;
    if (congestion > 70) next.push({ id: "high-congestion", label: "High congestion", tone: "warning", detail: `Latest congestion pressure is ${formatNumber(congestion)}.` });
    const topRisk = insights.data?.highest_risk_countries[0];
    if (topRisk) next.push({ id: "country-risk", label: "Climate warning", tone: topRisk.risk_exposure > 70 ? "critical" : "warning", detail: `${topRisk.country} leads country risk exposure.` });
    const disruption = data?.disruption_mix[0];
    if (disruption) next.push({ id: "port-disruption", label: "Port disruption", tone: "warning", detail: `${disruption.name}: ${formatMetric(disruption.value)} events in current mix.` });
    return next;
  }, [data, health.data, health.error, insights.data]);

  const searchItems = useMemo(() => [
    ...filteredPorts.slice(0, 12).map((item) => ({ label: item.port_name, detail: `${item.port_code} - ${item.country}`, action: () => setFilters((current) => ({ ...current, port: item.port_name, country: item.country ?? current.country })) })),
    ...filteredCountries.slice(0, 12).map((item) => ({ label: item.country, detail: `${item.iso3} - ${item.region}`, action: () => setFilters((current) => ({ ...current, country: item.country, region: item.region })) })),
    ...(insights.data?.top_trade_corridors.slice(0, 8).map((item) => ({ label: `${item.origin} to ${item.destination}`, detail: `Risk ${formatNumber(item.risk)} - ${formatMetric(item.value)}`, action: () => setFilters((current) => ({ ...current, tradeRoute: `${item.origin} to ${item.destination}` })) })) ?? [])
  ].filter((item) => !searchQuery || `${item.label} ${item.detail}`.toLowerCase().includes(searchQuery.toLowerCase())), [filteredCountries, filteredPorts, insights.data, searchQuery]);

  const portColumns: DataColumn<Port>[] = [
    { key: "port", label: "Port", value: (row) => row.port_name, render: (row) => <div><span className="font-medium text-white">{row.port_name}</span><span className="block font-mono text-[10px] text-slate-500">{row.port_code} - {row.country}</span></div> },
    { key: "calls", label: "Port calls", value: (row) => row.vessel_count, render: (row) => formatMetric(row.vessel_count), align: "right" },
    { key: "throughput", label: "Throughput", value: (row) => row.trade_value_usd, render: (row) => <span className="font-mono text-cyan-100">{formatMetric(row.trade_value_usd)}</span>, align: "right" },
    { key: "risk", label: "Risk", value: (row) => row.risk_score, render: (row) => <span className="text-[#F8E0AD]">{formatNumber(row.risk_score)}</span>, align: "right" }
  ];
  const countryColumns: DataColumn<CountryMetric>[] = [
    { key: "country", label: "Country", value: (row) => row.country, render: (row) => <div><span className="font-medium text-white">{row.country}</span><span className="block font-mono text-[10px] text-slate-500">{row.iso3} - {row.region}</span></div> },
    { key: "trade", label: "Trade", value: (row) => row.imports_usd + row.exports_usd, render: (row) => <span className="font-mono text-cyan-100">{formatMetric(row.imports_usd + row.exports_usd)}</span>, align: "right" },
    { key: "dependency", label: "Port dependency", value: (row) => row.dependency, align: "right" },
    { key: "risk", label: "Risk", value: (row) => row.risk_exposure, render: (row) => <span className="text-[#F8E0AD]">{formatNumber(row.risk_exposure)}</span>, align: "right" }
  ];

  return <AppShell><div className="space-y-8">
    <CommandCenterHeader
      apiStatus={health.error ? "offline" : health.data?.status ?? "checking"}
      databaseStatus={health.data?.database ?? "checking"}
      warehouseStatus={data ? "live" : dashboard.error ? "unavailable" : "loading"}
      lastRefresh={dashboard.dataUpdatedAt ? new Date(dashboard.dataUpdatedAt) : undefined}
      userRole={user?.role}
      isRefreshing={dashboard.isFetching || insights.isFetching || health.isFetching}
      alerts={alerts}
    />

    <GlobalFilters
      filters={filters}
      options={filterOptions}
      onChange={(patch) => setFilters((current) => ({ ...current, ...patch }))}
      onReset={() => setFilters(defaultDashboardFilters)}
      onSearch={() => setSearchOpen(true)}
    />

    {dashboard.isLoading && <LoadingState label="Building executive maritime picture" />}
    {dashboard.error && <ErrorState label="Unable to load the executive dashboard" />}
    {data && <>
      <section className="space-y-4"><SectionHeader index="01" title="Global Maritime Overview" description="Click a KPI to focus the dashboard and related analytics"/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{data.kpis.slice(0, 8).map((kpi, index) => <KpiCard key={kpi.label} {...kpi} index={index} active={activeKpi === kpi.label} onClick={() => setActiveKpi((current) => current === kpi.label ? null : kpi.label)} />)}</div></section>

      {activeKpi && <div className="rounded-md border border-cyan-300/15 bg-cyan-300/8 px-4 py-3 text-sm text-cyan-100">Drill-down focus: {activeKpi}. Charts and tables below are constrained by the global filters.</div>}

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]"><RealtimeStatusStrip /><NotificationCenter alerts={alerts} onSelect={(alert) => setActiveKpi(alert.label)} /></section>

      <section className="space-y-4"><SectionHeader index="02" title="Trade Intelligence" description="Volume, distribution, and corridor concentration"/><div className="grid gap-4 xl:grid-cols-3"><div className="xl:col-span-2"><AreaPanel title={`Global Trade Trend - ${period} months`} data={tradeTrend}/></div><LinePanel title="Vessel Activity Trend" data={data.vessel_activity_trend.slice(-period)}/></div><div className="grid gap-4 xl:grid-cols-2"><TreemapPanel title="Cargo Distribution" data={tradeDistribution}/><BarPanel title="Top Countries by Throughput" data={topCountries}/></div></section>

      <section className="space-y-4"><SectionHeader index="03" title="Risk Intelligence" description="Disruption exposure and geographic concentration"/><div className="grid gap-4 xl:grid-cols-2"><AreaPanel title="Congestion Pressure" data={data.congestion_trend.slice(-period)}/><PiePanel title="Disruption Mix" data={data.disruption_mix}/></div><HeatmapPanel title="Country Risk Exposure" data={data.risk_heatmap.filter((item) => filters.country === "All" || item.country === filters.country)}/></section>

      <section className="space-y-4"><SectionHeader index="04" title="Port Intelligence" description="Throughput leaders and strategic corridor pressure"/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{data.chokepoint_status.slice(0, 4).map((item) => <GaugeCard key={item.chokepoint_code} title={item.chokepoint_name} value={item.risk_score} subtitle={`${formatMetric(item.vessel_transits)} transits`}/>)}</div><div className="grid gap-4 xl:grid-cols-2"><BarPanel title="Top Ports by Throughput" data={topPorts}/><DataTable title="Port Performance Ranking" rows={filteredPorts} columns={portColumns} rowKey={(row) => row.port_code} pageSize={8}/></div></section>

      <section className="space-y-4"><SectionHeader index="05" title="Most Valuable Insights" description="The four executive signals worth acting on first"/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {insights.data?.highest_risk_countries[0] && <InsightCard label="Highest risk country" title={insights.data.highest_risk_countries[0].country} value={`${formatNumber(insights.data.highest_risk_countries[0].risk_exposure)} days`} detail={`${insights.data.highest_risk_countries[0].region} - ${insights.data.highest_risk_countries[0].dependency} connected ports`} icon={ShieldAlert} tone="rose"/>}
        <InsightCard label="Critical chokepoint" title={insights.data?.most_critical_chokepoints[0]?.chokepoint_name ?? "Monitoring"} value={formatMetric(insights.data?.most_critical_chokepoints[0]?.vessel_transits ?? 0)} detail="Recent vessel transits" icon={RadioTower} tone="gold"/>
        <InsightCard label="Fastest growing port" title={insights.data?.fastest_growing_ports[0]?.port_name ?? "Monitoring"} value={`${formatNumber(insights.data?.fastest_growing_ports[0]?.growth ?? 0, 1)}%`} detail="Growth momentum" icon={TrendingUp} tone="emerald"/>
        {insights.data?.largest_spillover_effects[0] && <InsightCard label="Largest spillover" title={`${insights.data.largest_spillover_effects[0].source} to ${insights.data.largest_spillover_effects[0].destination}`} value={formatMetric(insights.data.largest_spillover_effects[0].impact)} detail={insights.data.largest_spillover_effects[0].industry} icon={Network} tone="cyan"/>}
      </div><DataTable title="Country Intelligence Ranking" rows={filteredCountries} columns={countryColumns} rowKey={(row) => row.iso3} pageSize={8}/></section>
    </>}

    {searchOpen && (
      <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/80 px-4 py-20 backdrop-blur-xl" onClick={() => setSearchOpen(false)}>
        <div className="w-full max-w-2xl rounded-lg border border-cyan-300/20 bg-[#03152D] p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center gap-3 border-b border-cyan-300/10 pb-3">
            <Search className="text-cyan-200" size={18} />
            <input autoFocus value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search ports, countries, trade routes..." className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
            <button type="button" onClick={() => setSearchOpen(false)} className="table-action h-8 w-8"><X size={14} /></button>
          </div>
          <div className="mt-3 max-h-[420px] overflow-y-auto">
            {searchItems.slice(0, 12).map((item) => <button key={`${item.label}-${item.detail}`} type="button" onClick={() => { item.action(); setSearchOpen(false); }} className="w-full rounded-md px-3 py-3 text-left transition hover:bg-cyan-300/10"><span className="block text-sm text-white">{item.label}</span><span className="mt-1 block text-xs text-slate-500">{item.detail}</span></button>)}
          </div>
        </div>
      </div>
    )}
  </div></AppShell>;
}
