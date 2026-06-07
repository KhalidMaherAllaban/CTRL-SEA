"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { BarPanel } from "@/components/charts/analytics-charts";
import { Card, CardTitle } from "@/components/ui/card";
import { endpoints } from "@/lib/api";

export default function TradeRiskPage() {
  const { data } = useQuery({ queryKey: ["trade"], queryFn: endpoints.trade });
  return (
    <AppShell>
      {data && (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <BarPanel title="Trade Value At Risk" data={data.value_at_risk.map((x) => ({ name: x.industry, value: x.value }))} />
            <BarPanel title="Downtime Analysis" data={data.downtime.map((x) => ({ name: x.country, value: x.days }))} />
          </div>
          <Card>
            <CardTitle>Trade Flow Analysis</CardTitle>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {data.trade_flows.map((flow) => (
                <div key={`${flow.origin}-${flow.destination}`} className="rounded-md border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-white">{flow.origin} → {flow.destination}</p>
                  <p className="mt-2 text-sm text-slate-400">${flow.value}B flow · Risk {flow.risk}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
