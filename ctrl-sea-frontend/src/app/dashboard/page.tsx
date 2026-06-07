"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AreaPanel, BarPanel, GaugeCard, HeatmapPanel, LinePanel, PiePanel, TreemapPanel } from "@/components/charts/analytics-charts";
import { Card, CardTitle } from "@/components/ui/card";
import { endpoints } from "@/lib/api";
import { formatUsd } from "@/lib/utils";

const periods = ["Daily", "Weekly", "Monthly"] as const;

export default function DashboardPage() {
  const [period, setPeriod] = useState<(typeof periods)[number]>("Daily");
  const { data, isLoading, error } = useQuery({ queryKey: ["dashboard"], queryFn: endpoints.dashboard });
  const tradeTrend = useMemo(() => data?.trade_trend.map((row, index) => ({ ...row, value: period === "Daily" ? row.value : period === "Weekly" ? Math.round(row.value * 6.4 + index * 2) : Math.round(row.value * 27.5) })) ?? [], [data, period]);

  return (
    <AppShell>
      {isLoading && <p className="text-cyan-200">Loading command overview...</p>}
      {error && <p className="text-rose-300">Unable to load dashboard. Check the API service.</p>}
      {data && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#D6A85F]">PortWatch-compatible intelligence</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Global maritime command overview</h2>
            </div>
            <div className="flex rounded-md border border-cyan-300/15 bg-slate-950/70 p-1">
              {periods.map((item) => (
                <button key={item} onClick={() => setPeriod(item)} className={`rounded px-3 py-1.5 text-sm transition ${period === item ? "bg-cyan-300/15 text-cyan-100" : "text-slate-400 hover:text-white"}`}>{item}</button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.kpis.map((kpi) => <KpiCard key={kpi.label} {...kpi} />)}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2"><AreaPanel title={`Global Trade Trend (${period})`} data={tradeTrend} /></div>
            <LinePanel title="Vessel Activity Trend" data={data.vessel_activity_trend} />
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <AreaPanel title="Port Congestion Trend" data={data.congestion_trend} />
            <PiePanel title="Disruption Mix" data={data.disruption_mix} />
            <TreemapPanel title="Trade Distribution" data={data.trade_distribution} />
          </div>

          <HeatmapPanel title="Country Risk Heatmap" data={data.risk_heatmap} />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {data.chokepoint_status.slice(0, 4).map((item) => (
              <GaugeCard key={item.chokepoint_code} title={item.chokepoint_name} value={item.risk_score} subtitle={`${item.vessel_transits} daily transits`} />
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <BarPanel title="Top Ports by Cargo Value" data={data.port_rankings.map((p) => ({ name: p.port_name, value: Math.round(p.trade_value_usd / 1_000_000_000) }))} />
            <BarPanel title="Top Countries by Maritime Trade" data={data.country_rankings.map((c) => ({ name: c.iso3, value: Math.round((c.imports_usd + c.exports_usd) / 1_000_000_000) }))} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <RankingTable title="Top Ports Ranking" rows={data.port_rankings.map((port) => ({ name: port.port_name, meta: `${port.port_code} · ${port.country}`, value: formatUsd(port.trade_value_usd), score: port.risk_score }))} />
            <RankingTable title="Top Countries Ranking" rows={data.country_rankings.map((country) => ({ name: country.country, meta: `${country.iso3} · ${country.region}`, value: formatUsd(country.imports_usd + country.exports_usd), score: country.risk_exposure }))} />
          </div>
        </div>
      )}
    </AppShell>
  );
}

function RankingTable({ title, rows }: { title: string; rows: Array<{ name: string; meta: string; value: string; score: number }> }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-slate-500"><tr><th className="py-2">Rank</th><th>Name</th><th>Value</th><th>Risk</th></tr></thead>
          <tbody>
            {rows.slice(0, 8).map((row, index) => (
              <tr key={row.name} className="border-t border-slate-800">
                <td className="py-3 text-[#D6A85F]">{index + 1}</td>
                <td className="text-white">{row.name}<span className="block text-xs text-slate-500">{row.meta}</span></td>
                <td className="text-cyan-100">{row.value}</td>
                <td>{row.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
