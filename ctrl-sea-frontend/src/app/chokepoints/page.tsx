"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { BarPanel, GaugeCard, LinePanel } from "@/components/charts/analytics-charts";
import { Card, CardTitle } from "@/components/ui/card";
import { endpoints } from "@/lib/api";
import { formatUsd } from "@/lib/utils";
import type { Chokepoint } from "@/lib/types";

type ChokepointInsight = Chokepoint & {
  congestion: number;
  trade_impact_usd: number;
};

export default function ChokepointsPage() {
  const { data } = useQuery({ queryKey: ["chokepoint-analytics"], queryFn: endpoints.chokepointAnalytics });
  return (
    <AppShell>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data?.items.slice(0, 4).map((item: ChokepointInsight) => (
          <GaugeCard key={item.chokepoint_code} title={item.chokepoint_name} value={item.risk_score} subtitle={`${item.congestion}% congestion`} />
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {data && <BarPanel title="Daily Vessel Transits" data={data.transits} />}
        {data && <BarPanel title="Chokepoint Risk Index" data={data.risk} yKey="risk" />}
        {data && <BarPanel title="Trade Impact (USD B)" data={data.trade_impact} />}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {data && <BarPanel title="Congestion Pressure" data={data.congestion} />}
        {data && <LinePanel title="Historical Risk Trend" data={data.history} yKey="SUEZ" />}
      </div>
      <Card className="mt-4">
        <CardTitle>Strategic Corridor Brief</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500"><tr><th className="py-2">Corridor</th><th>Region</th><th>Traffic</th><th>Congestion</th><th>Trade Impact</th><th>Risk</th></tr></thead>
            <tbody>
              {data?.items.map((item: ChokepointInsight) => (
                <tr key={item.chokepoint_code} className="border-t border-slate-800">
                  <td className="py-3 text-white">{item.chokepoint_name}</td>
                  <td>{item.region}</td>
                  <td>{item.vessel_transits}</td>
                  <td>{item.congestion}%</td>
                  <td className="text-cyan-100">{formatUsd(item.trade_impact_usd)}</td>
                  <td className="text-[#D6A85F]">{item.risk_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
