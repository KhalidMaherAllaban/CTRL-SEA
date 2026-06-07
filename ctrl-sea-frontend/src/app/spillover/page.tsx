"use client";

import { useMutation } from "@tanstack/react-query";
import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { BarPanel, LinePanel, SankeyPanel } from "@/components/charts/analytics-charts";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { endpoints } from "@/lib/api";
import type { SpilloverPayload } from "@/lib/types";

const DEFAULT_PAYLOAD: SpilloverPayload = { port: "Alexandria", country: "Egypt", industry: "Electronics", scenario: "Suez closure 14 days" };

export default function SpilloverPage() {
  const [payload, setPayload] = useState<SpilloverPayload>(DEFAULT_PAYLOAD);
  const { data, mutate } = useMutation({ mutationFn: endpoints.spillover });

  useEffect(() => {
    mutate(DEFAULT_PAYLOAD);
  }, [mutate]);

  function submit(event: FormEvent) {
    event.preventDefault();
    mutate(payload);
  }

  return (
    <AppShell>
      <form onSubmit={submit} className="mb-5 grid gap-3 rounded-lg border border-cyan-300/15 bg-slate-950/50 p-4 md:grid-cols-5">
        {(["port", "country", "industry", "scenario"] as const).map((key) => (
          <Select key={key} value={payload[key]} onChange={(event) => setPayload((current) => ({ ...current, [key]: event.target.value }))}>
            {(key === "port" ? ["Alexandria", "Singapore", "Shanghai", "Rotterdam", "Los Angeles"] : key === "country" ? ["Egypt", "China", "Singapore", "Netherlands", "United States"] : key === "industry" ? ["Electronics", "Energy", "Food", "Automotive", "Chemicals"] : ["Suez closure 14 days", "Cyclone port outage", "Conflict escalation", "Extreme flood"]).map((option) => <option key={option}>{option}</option>)}
          </Select>
        ))}
        <Button type="submit">Run Simulation</Button>
      </form>
      {data && (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <SankeyPanel data={data.sankey} />
            <LinePanel title="Risk Propagation" data={data.propagation.map((x) => ({ month: `T+${x.step}`, value: x.risk }))} />
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <BarPanel title="Affected Countries" data={data.affected_countries.map((x) => ({ name: x.country, value: x.impact }))} />
            <BarPanel title="Trade Losses" data={data.trade_losses} yKey="loss" />
            <Card>
              <CardTitle>Supply Chain Impact</CardTitle>
              <div className="mt-4 space-y-3">
                {data.supply_chain_impact.slice(0, 6).map((item) => (
                  <div key={item.country} className="flex items-center justify-between rounded-md bg-slate-950/70 p-3 text-sm">
                    <span>{item.country}</span><span className="text-cyan-200">{item.impact}</span>
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
