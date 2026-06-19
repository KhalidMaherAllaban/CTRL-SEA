"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { BarPanel, LinePanel, SankeyPanel } from "@/components/charts/analytics-charts";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { endpoints } from "@/lib/api";
import type { SpilloverPayload } from "@/lib/types";

const EMPTY_PAYLOAD: SpilloverPayload = { port: "", country: "", industry: "", scenario: "present" };

export default function SpilloverPage() {
  const [payload, setPayload] = useState<SpilloverPayload>(EMPTY_PAYLOAD);
  const map = useQuery({ queryKey: ["spillover-map-options"], queryFn: endpoints.mapLayers });
  const { data, error, isPending, mutate } = useMutation({ mutationFn: endpoints.spillover });
  const initialized = useRef(false);
  const portOptions = useMemo(() => {
    if (!map.data) return [];
    const routeOrigins = new Set(map.data.trade_flows.map((route) => route.origin));
    const routedPorts = map.data.ports.filter((port) => routeOrigins.has(port.port_name));
    return (routedPorts.length ? routedPorts : map.data.ports).slice(0, 250);
  }, [map.data]);
  const countryOptions = useMemo(() => map.data?.countries.filter((item) => item.iso3 && item.country) ?? [], [map.data]);
  const industryOptions = useMemo(() => map.data?.trade_flows.map((item) => item.commodity).filter(Boolean) ?? [], [map.data]);

  useEffect(() => {
    if (initialized.current || !map.data || !portOptions.length || !countryOptions.length) return;
    const firstRoute = map.data.trade_flows[0];
    const routePort = portOptions.find((item) => item.port_name === firstRoute?.origin);
    const routeCountry = countryOptions.find((item) => item.country === firstRoute?.origin_country);
    const initial = { port: routePort?.port_code ?? portOptions[0].port_code, country: routeCountry?.iso3 ?? countryOptions[0].iso3, industry: "", scenario: "present" };
    initialized.current = true;
    setPayload(initial);
    mutate(initial);
  }, [countryOptions, industryOptions, map.data, mutate, portOptions]);

  function submit(event: FormEvent) {
    event.preventDefault();
    mutate(payload);
  }

  return (
    <AppShell>
      <form onSubmit={submit} className="mb-5 grid gap-3 rounded-lg border border-cyan-300/15 bg-slate-950/50 p-4 md:grid-cols-5">
        <Select aria-label="Source port" value={payload.port} onChange={(event) => setPayload((current) => ({ ...current, port: event.target.value }))}>{portOptions.map((port) => <option key={port.port_code} value={port.port_code}>{port.port_name} ({port.port_code})</option>)}</Select>
        <Select aria-label="Source country" value={payload.country} onChange={(event) => setPayload((current) => ({ ...current, country: event.target.value }))}>{countryOptions.map((item) => <option key={item.iso3} value={item.iso3}>{item.country} ({item.iso3})</option>)}</Select>
        <Select aria-label="Industry" value={payload.industry} onChange={(event) => setPayload((current) => ({ ...current, industry: event.target.value }))}><option value="">All industries</option>{Array.from(new Set(industryOptions)).map((industry) => <option key={industry} value={industry}>{industry}</option>)}</Select>
        <Select aria-label="Risk scenario" value={payload.scenario} onChange={(event) => setPayload((current) => ({ ...current, scenario: event.target.value }))}>{["present", "rcp26", "rcp45", "rcp85"].map((scenario) => <option key={scenario} value={scenario}>{scenario.toUpperCase()}</option>)}</Select>
        <Button type="submit" disabled={!payload.port || !payload.country || isPending}>{isPending ? "Running…" : "Run Simulation"}</Button>
      </form>
      {error && <p className="mb-4 rounded-md border border-rose-300/25 bg-rose-400/10 p-3 text-sm text-rose-200">Unable to run the spillover analysis.</p>}
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
