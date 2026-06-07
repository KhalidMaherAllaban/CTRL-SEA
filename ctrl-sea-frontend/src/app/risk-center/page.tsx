"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CloudLightning, RadioTower, ShieldAlert, Ship, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { BarPanel, GaugeCard, HeatmapPanel, MultiLinePanel, StackedAreaPanel } from "@/components/charts/analytics-charts";
import { Card, CardTitle } from "@/components/ui/card";
import { endpoints } from "@/lib/api";
import { formatUsd } from "@/lib/utils";

export default function RiskCenterPage() {
  const climate = useQuery({ queryKey: ["risk-climate"], queryFn: endpoints.climate });
  const trade = useQuery({ queryKey: ["risk-trade"], queryFn: endpoints.trade });
  const disruptions = useQuery({ queryKey: ["risk-disruptions"], queryFn: endpoints.disruptions });
  const mapLayers = useQuery({ queryKey: ["risk-map-layers"], queryFn: endpoints.mapLayers });

  const riskScores = useMemo(() => {
    const weather = Math.round((climate.data?.risk_by_country.reduce((sum, item) => sum + item.risk, 0) ?? 0) / Math.max(1, climate.data?.risk_by_country.length ?? 1));
    const conflict = Math.round((disruptions.data?.filter((item) => item.event_type.includes("Conflict") || item.event_type.includes("Geopolitical")).reduce((sum, item) => sum + item.impact_score, 0) ?? 142) / 2);
    const congestion = Math.round((mapLayers.data?.ports.reduce((sum, item) => sum + (item.congestion ?? 0), 0) ?? 0) / Math.max(1, mapLayers.data?.ports.length ?? 1));
    const supply = Math.round((trade.data?.value_at_risk.reduce((sum, item) => sum + item.value, 0) ?? 0) / Math.max(1, trade.data?.value_at_risk.length ?? 1));
    const chokepoint = Math.round((mapLayers.data?.chokepoints.reduce((sum, item) => sum + item.risk_score, 0) ?? 0) / Math.max(1, mapLayers.data?.chokepoints.length ?? 1));
    return { weather, conflict, congestion, supply, chokepoint, global: Math.round((weather + conflict + congestion + supply + chokepoint) / 5) };
  }, [climate.data, disruptions.data, mapLayers.data, trade.data]);

  const trend = useMemo(() => Array.from({ length: 10 }, (_, index) => ({
    month: `T-${9 - index}`,
    weather: Math.max(30, riskScores.weather - 10 + index * 1.5),
    conflict: Math.max(30, riskScores.conflict - 14 + index * 2.1),
    congestion: Math.max(30, riskScores.congestion - 8 + index * 1.2),
    supply: Math.max(30, riskScores.supply - 11 + index * 1.6)
  })), [riskScores]);

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#D6A85F]">Maritime risk score engine</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Global Maritime Risk Center</h2>
          </div>
          <div className="rounded-md border border-rose-300/25 bg-rose-400/10 px-4 py-2 text-sm text-rose-100">
            {disruptions.data?.length ?? "--"} active alerts
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <GaugeCard title="Global Risk" value={riskScores.global} subtitle="Composite maritime score" />
          <RiskTile icon={CloudLightning} label="Weather Risk" value={riskScores.weather} />
          <RiskTile icon={ShieldAlert} label="Conflict Risk" value={riskScores.conflict} />
          <RiskTile icon={Ship} label="Congestion Risk" value={riskScores.congestion} />
          <RiskTile icon={RadioTower} label="Chokepoint Risk" value={riskScores.chokepoint} />
          <RiskTile icon={AlertTriangle} label="Supply Chain Risk" value={riskScores.supply} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
          <MultiLinePanel title="Maritime Risk Trend" data={trend} series={[{ key: "weather", label: "Weather", color: "#30D5FF" }, { key: "conflict", label: "Conflict", color: "#FF5C7C" }, { key: "congestion", label: "Congestion", color: "#FFB547" }, { key: "supply", label: "Supply Chain", color: "#00E5A0" }]} />
          <StackedAreaPanel title="Risk Contribution Stack" data={trend} series={[{ key: "weather", label: "Weather", color: "#30D5FF" }, { key: "conflict", label: "Conflict", color: "#FF5C7C" }, { key: "congestion", label: "Congestion", color: "#FFB547" }, { key: "supply", label: "Supply Chain", color: "#00E5A0" }]} />
        </div>

        {mapLayers.data && <HeatmapPanel title="Country and Corridor Risk Heatmap" data={mapLayers.data.countries.map((country) => ({ country: country.country, region: country.region, risk: country.risk_exposure }))} />}

        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardTitle>Active Maritime Alerts</CardTitle>
            <div className="mt-4 space-y-3">
              {disruptions.data?.slice(0, 7).map((event) => (
                <div key={event.id} className="rounded-md border border-cyan-300/10 bg-slate-950/45 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{event.event_name}</p>
                      <p className="mt-1 text-xs text-slate-500">{event.affected_routes.join(", ")} | {event.impacted_ports.join(", ")}</p>
                    </div>
                    <span className="rounded border border-rose-300/25 bg-rose-400/10 px-2 py-1 text-xs text-rose-100">{event.severity}</span>
                  </div>
                  <div className="mt-3 flex justify-between text-sm">
                    <span className="text-slate-400">Impact {event.impact_score}</span>
                    <span className="text-[#D6A85F]">{formatUsd(event.estimated_loss_usd)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            {trade.data && <BarPanel title="Trade Value at Risk" data={trade.data.value_at_risk.map((item) => ({ name: item.industry, value: item.value }))} />}
            <Card>
              <CardTitle>AI Risk Narratives</CardTitle>
              <div className="mt-4 space-y-3">
                {[
                  "Port congestion in East Asia is increasing relative to the prior operating window.",
                  "Red Sea and Gulf chokepoints remain the highest-risk corridors for energy and container flows.",
                  "Global trade activity is recovering, but supply-chain risk remains concentrated around canal-dependent routes."
                ].map((item) => (
                  <p key={item} className="rounded-md border border-cyan-300/10 bg-slate-950/45 p-3 text-sm leading-6 text-slate-300"><Sparkles className="mb-2 text-[#D6A85F]" size={16} />{item}</p>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function RiskTile({ icon: Icon, label, value }: { icon: typeof ShieldAlert; label: string; value: number }) {
  const tone = value >= 70 ? "text-rose-300 border-rose-300/25 bg-rose-400/10" : value >= 55 ? "text-[#D6A85F] border-[#D6A85F]/25 bg-[#D6A85F]/10" : "text-cyan-100 border-cyan-300/20 bg-cyan-300/10";
  return (
    <Card className={`min-h-56 ${tone}`}>
      <Icon size={22} />
      <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-4 text-4xl font-semibold text-white">{value}</p>
      <div className="mt-4 h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-current" style={{ width: `${value}%` }} /></div>
    </Card>
  );
}
