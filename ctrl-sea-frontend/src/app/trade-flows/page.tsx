"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pause, Play, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { BarPanel, MultiLinePanel, SankeyPanel } from "@/components/charts/analytics-charts";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { endpoints } from "@/lib/api";
import type { TradeFlow } from "@/lib/types";

function toMapPosition(longitude: number, latitude: number) {
  return { x: ((longitude + 180) / 360) * 100, y: ((90 - latitude) / 180) * 100 };
}

function flowPath(flow: TradeFlow) {
  const start = toMapPosition(flow.origin_lon, flow.origin_lat);
  const end = toMapPosition(flow.destination_lon, flow.destination_lat);
  const controlX = (start.x + end.x) / 2;
  const controlY = Math.min(start.y, end.y) - 12;
  return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
}

export default function TradeFlowsPage() {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const { data } = useQuery({ queryKey: ["global-trade-flows"], queryFn: endpoints.mapLayers });
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: endpoints.dashboard });
  const insights = useQuery({ queryKey: ["insights"], queryFn: endpoints.insights });

  useEffect(() => {
    if (!playing || !data?.trade_flows.length) return;
    const timer = window.setInterval(() => setFocusedIndex((current) => (current + 1) % data.trade_flows.length), 1200);
    return () => window.clearInterval(timer);
  }, [data?.trade_flows.length, playing]);

  const sankey = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    const names = Array.from(new Set(data.trade_flows.flatMap((flow) => [flow.origin_country, flow.destination_country])));
    return {
      nodes: names.map((name) => ({ name })),
      links: data.trade_flows.map((flow) => ({ source: flow.origin_country, target: flow.destination_country, value: flow.value }))
    };
  }, [data]);

  return (
    <AppShell>
      {data ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#D6A85F]">Animated trade corridors</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Global Trade Flows Command</h2>
            </div>
            <Button onClick={() => setPlaying(!playing)}><span>{playing ? <Pause size={16} /> : <Play size={16} />}</span>{playing ? "Pause Playback" : "Play Routes"}</Button>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.4fr_.6fr]">
            <Card className="relative h-[560px] overflow-hidden">
              <CardTitle>Live Maritime Trade Corridors</CardTitle>
              <div className="absolute inset-x-5 bottom-5 z-10 rounded-md border border-cyan-300/15 bg-slate-950/75 p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Corridor Playback</span>
                  <input aria-label="Trade corridor playback" type="range" min={0} max={Math.max(0, data.trade_flows.length - 1)} value={Math.min(focusedIndex, Math.max(0, data.trade_flows.length - 1))} onChange={(event) => setFocusedIndex(Number(event.target.value))} className="w-full accent-cyan-300" />
                  <span className="w-24 text-right text-sm text-cyan-100">{data.trade_flows.length ? `${focusedIndex + 1}/${data.trade_flows.length}` : "0/0"}</span>
                </div>
              </div>
              <div className="absolute inset-0 mt-12 bg-[radial-gradient(circle_at_50%_45%,rgba(48,213,255,.18),transparent_32%),linear-gradient(90deg,rgba(48,213,255,.08)_1px,transparent_1px),linear-gradient(rgba(48,213,255,.08)_1px,transparent_1px)] bg-[size:100%_100%,52px_52px,52px_52px]" />
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                {data.trade_flows.map((flow, index) => (
                  <path key={flow.route_id} d={flowPath(flow)} fill="none" stroke={flow.risk > 60 ? "#D6A85F" : "#30D5FF"} strokeWidth={index === focusedIndex ? Math.max(0.65, flow.value / 180) : Math.max(0.25, flow.value / 320)} strokeDasharray="2 2" className="ctrl-sea-route-pulse" opacity={index === focusedIndex ? 1 : 0.35} />
                ))}
              </svg>
              {data.trade_flows.map((flow) => {
                const origin = toMapPosition(flow.origin_lon, flow.origin_lat);
                const destination = toMapPosition(flow.destination_lon, flow.destination_lat);
                return (
                  <div key={flow.route_id}>
                    <div className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(48,213,255,.95)]" style={{ left: `${origin.x}%`, top: `${origin.y}%` }} title={flow.origin} />
                    <div className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D6A85F] shadow-[0_0_18px_rgba(214,168,95,.95)]" style={{ left: `${destination.x}%`, top: `${destination.y}%` }} title={flow.destination} />
                  </div>
                );
              })}
            </Card>

            <Card>
              <CardTitle>AI Insights</CardTitle>
              <div className="mt-4 space-y-3">
                {(insights.data?.narratives ?? []).map((insight) => (
                  <div key={insight} className="rounded-md border border-cyan-300/10 bg-slate-950/45 p-3 text-sm leading-6 text-slate-300">
                    <Sparkles className="mb-2 text-[#D6A85F]" size={16} />
                    {insight}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <MultiLinePanel title="Global Trade Trend" data={dashboard.data?.trade_trend ?? []} series={[{ key: "value", label: "Trade Volume", color: "#30D5FF" }]} />
            <SankeyPanel data={sankey} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <BarPanel title="Top Corridors by Daily Capacity at Risk" data={data.trade_flows.map((flow) => ({ name: flow.route_id, value: flow.value }))} />
            <Card>
              <CardTitle>Corridor Ranking</CardTitle>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-500"><tr><th className="py-2">Route</th><th>Measure</th><th>Capacity at Risk</th><th>Risk</th></tr></thead>
                  <tbody>
                    {data.trade_flows.map((flow) => (
                      <tr key={flow.route_id} className="border-t border-slate-800">
                        <td className="py-3 text-white">{flow.origin} to {flow.destination}<span className="block text-xs text-slate-500">{flow.origin_country} to {flow.destination_country}</span></td>
                        <td>{flow.commodity}</td>
                        <td className="text-cyan-100">{Number(flow.value).toLocaleString()}</td>
                        <td className="text-[#D6A85F]">{flow.risk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      ) : <p className="text-cyan-200">Loading global trade flow intelligence...</p>}
    </AppShell>
  );
}
