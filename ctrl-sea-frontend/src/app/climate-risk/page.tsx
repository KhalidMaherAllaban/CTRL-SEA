"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { AreaPanel, BarPanel } from "@/components/charts/analytics-charts";
import { Card, CardTitle } from "@/components/ui/card";
import { endpoints } from "@/lib/api";

export default function ClimateRiskPage() {
  const { data } = useQuery({ queryKey: ["climate"], queryFn: endpoints.climate });
  return (
    <AppShell>
      {data && (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <BarPanel title="Scenario Asset Damage" data={data.scenario_comparison.map((x) => ({ name: x.scenario, value: x.assetDamage }))} />
            <AreaPanel title="Risk by Scenario" data={data.trend} />
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <BarPanel title="Risk By Country" data={data.risk_by_country.map((x) => ({ name: x.country, value: x.risk }))} />
            <Card>
              <CardTitle>Hazard Heatmap</CardTitle>
              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                {data.hazard_heatmap.map((cell) => (
                  <div key={`${cell.country}-${cell.hazard}`} className="rounded-md border border-cyan-300/10 bg-slate-950/70 p-3">
                    <p className="text-xs text-slate-500">{cell.country}</p>
                    <p className="text-sm text-white">{cell.hazard}</p>
                    <div className="mt-2 h-2 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-cyan-300" style={{ width: `${cell.risk}%` }} /></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
