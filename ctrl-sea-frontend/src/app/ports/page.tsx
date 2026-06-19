"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AreaPanel, BarPanel, LinePanel } from "@/components/charts/analytics-charts";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { endpoints } from "@/lib/api";
import { formatMetric } from "@/lib/utils";

export default function PortsPage() {
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const { data } = useQuery({ queryKey: ["ports", search, country], queryFn: () => endpoints.ports({ search, country, size: 50 }) });
  const analytics = useQuery({ queryKey: ["port-analytics"], queryFn: endpoints.portAnalytics });
  return (
    <AppShell>
      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_260px_180px]">
        <div className="flex items-center gap-2 rounded-md border border-slate-700 bg-slate-950/70 px-3">
          <Search size={16} className="text-slate-500" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search ports or UN/LOCODE" className="border-0 bg-transparent focus:ring-0" />
        </div>
        <Input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="Country filter" />
        <Input placeholder="Date window" value="Last 30 days" readOnly />
      </div>
      {analytics.data && (
        <div className="mb-4 grid gap-4 xl:grid-cols-3">
          <AreaPanel title="Import Trend" data={analytics.data.import_trend} />
          <AreaPanel title="Export Trend" data={analytics.data.export_trend} />
          <LinePanel title="Congestion Trend" data={analytics.data.congestion_trend} />
        </div>
      )}
      <div className="grid gap-4 xl:grid-cols-3">
        {analytics.data && <BarPanel title="Port Performance Score" data={analytics.data.performance} yKey="score" />}
        {analytics.data && <BarPanel title="Vessel Arrivals" data={analytics.data.arrivals_departures} yKey="arrivals" />}
        {analytics.data && <BarPanel title="Vessel Departures" data={analytics.data.arrivals_departures} yKey="departures" />}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {analytics.data && <BarPanel title="Import Export Activity" data={analytics.data.volume} yKey="imports" />}
        <Card>
          <CardTitle>Port Ranking</CardTitle>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-500"><tr><th className="py-2">Port</th><th>Type</th><th>Vessels</th><th>Throughput</th><th>Risk</th></tr></thead>
              <tbody>
                {data?.items.map((port) => (
                  <tr key={port.port_code} className="border-t border-slate-800">
                    <td className="py-3 text-white">{port.port_name}<span className="block text-xs text-slate-500">{port.port_code}</span></td>
                    <td>{port.port_type}</td>
                    <td>{port.vessel_count}</td>
                    <td>{formatMetric(port.trade_value_usd)}</td>
                    <td className="text-cyan-200">{port.risk_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
