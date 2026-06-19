"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { BarPanel, HeatmapPanel } from "@/components/charts/analytics-charts";
import { Card, CardTitle } from "@/components/ui/card";
import { endpoints } from "@/lib/api";
import type { ExecutiveInsights } from "@/lib/types";
import { formatMetric, formatUsd } from "@/lib/utils";

type RiskCenter = {
  climate: { risk_by_country: Array<{ country: string; risk: number; damage: number }> };
  trade: { value_at_risk: Array<{ industry: string; value: number }> };
  disruptions: Array<{ id: number; event_name: string; severity: string; impact_score: number; estimated_loss_usd: number }>;
  top_risk_locations: Array<{ portid: string; portname: string; country: string; latitude: number; longitude: number; risk_score: number }>;
};

export default function RiskCenterPage() {
  const risk = useQuery<RiskCenter>({ queryKey: ["risk-center"], queryFn: endpoints.riskCenter });
  const insights = useQuery<ExecutiveInsights>({ queryKey: ["insights"], queryFn: endpoints.insights });

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs uppercase tracking-[0.24em] text-[#D6A85F]">Warehouse risk intelligence</p><h2 className="mt-1 text-2xl font-semibold text-white">Global Maritime Risk Center</h2></div>
          <div className="rounded-md border border-rose-300/25 bg-rose-400/10 px-4 py-2 text-sm text-rose-100">{risk.data?.disruptions.length ?? "--"} disruption records</div>
        </div>

        {risk.isLoading && <p className="text-cyan-200">Aggregating climate, trade, and disruption risk…</p>}
        {risk.error && <p className="text-rose-300">Risk intelligence is currently unavailable.</p>}
        {risk.data && (
          <>
            <div className="grid gap-4 xl:grid-cols-2">
              <BarPanel title="Trade Value at Risk by Industry" data={risk.data.trade.value_at_risk.map((item) => ({ name: item.industry, value: item.value }))} />
              <HeatmapPanel title="Country Climate Risk" data={risk.data.climate.risk_by_country.map((item) => ({ country: item.country, region: "Port downtime", risk: item.risk }))} />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <Card><CardTitle>Highest-Risk Port Locations</CardTitle><div className="mt-4 space-y-2">{risk.data.top_risk_locations.slice(0, 10).map((item, index) => <div key={item.portid} className="flex justify-between rounded-md border border-cyan-300/10 bg-slate-950/45 p-3 text-sm"><span className="text-white">{index + 1}. {item.portname}<small className="ml-2 text-slate-500">{item.country}</small></span><span className="text-[#D6A85F]">{item.risk_score.toFixed(2)} days</span></div>)}</div></Card>
              <Card><CardTitle>Warehouse-Generated Insights</CardTitle><div className="mt-4 space-y-3">{insights.data?.narratives.map((item) => <p key={item} className="rounded-md border border-cyan-300/10 bg-slate-950/45 p-3 text-sm leading-6 text-slate-300"><Sparkles className="mb-2 text-[#D6A85F]" size={16} />{item}</p>)}</div></Card>
            </div>
            {insights.data && <div className="grid gap-4 xl:grid-cols-3">
              <Card><CardTitle>Fastest-Growing Ports</CardTitle><div className="mt-4 space-y-2">{insights.data.fastest_growing_ports.map((item) => <div key={item.port_code} className="flex justify-between text-sm"><span className="text-slate-300">{item.port_name}</span><span className="text-emerald-300">+{item.growth.toFixed(1)}%</span></div>)}</div></Card>
              <Card><CardTitle>Largest Spillover Effects</CardTitle><div className="mt-4 space-y-2">{insights.data.largest_spillover_effects.map((item) => <div key={`${item.source}-${item.destination}-${item.industry}`} className="flex justify-between gap-3 text-sm"><span className="truncate text-slate-300">{item.source} to {item.destination}</span><span className="text-cyan-200">{formatMetric(item.impact)}</span></div>)}</div></Card>
              <Card><CardTitle>Most Disrupted Regions</CardTitle><div className="mt-4 space-y-2">{insights.data.most_disrupted_regions.map((item) => <div key={item.region} className="flex justify-between gap-3 text-sm"><span className="truncate text-slate-300">{item.region}</span><span className="text-rose-200">{item.disruptions}</span></div>)}</div></Card>
            </div>}
            <Card><CardTitle>Recent Disruption Exposure</CardTitle><div className="mt-4 grid gap-3 lg:grid-cols-2">{risk.data.disruptions.slice(0, 10).map((event) => <div key={event.id} className="rounded-md border border-rose-300/15 bg-slate-950/45 p-3"><div className="flex justify-between gap-3"><p className="font-semibold text-white">{event.event_name}</p><span className="text-xs text-rose-200">{event.severity}</span></div><div className="mt-2 flex justify-between text-sm text-slate-400"><span><AlertTriangle className="mr-1 inline" size={14} />{event.impact_score} affected ports</span><span className="text-[#D6A85F]">{formatUsd(event.estimated_loss_usd)}</span></div></div>)}</div></Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
