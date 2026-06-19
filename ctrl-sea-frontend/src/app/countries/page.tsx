"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { AreaPanel, BarPanel, HeatmapPanel } from "@/components/charts/analytics-charts";
import { Card, CardTitle } from "@/components/ui/card";
import { endpoints } from "@/lib/api";
import { formatMetric } from "@/lib/utils";

export default function CountriesPage() {
  const { data } = useQuery({ queryKey: ["country-analytics"], queryFn: endpoints.countryAnalytics });
  return (
    <AppShell>
      {data ? (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-3">
            <AreaPanel title="Country Throughput Trend" data={data.trend} />
            <BarPanel title="Throughput Dependency" data={data.dependency} xKey="country" />
            <BarPanel title="Top Maritime Partners" data={data.partners} xKey="country" />
          </div>
          <HeatmapPanel title="Country Risk Exposure Map" data={data.risk_exposure.map((row) => ({ country: row.country, risk: row.risk, region: "Maritime exposure" }))} />
          <div className="grid gap-4 xl:grid-cols-2">
            <BarPanel title="Import vs Export Throughput" data={data.trade_balance.map((row) => ({ name: row.country, value: row.imports, exports: row.exports }))} />
            <Card>
              <CardTitle>Country Intelligence Ranking</CardTitle>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-500"><tr><th className="py-2">Country</th><th>Imports</th><th>Exports</th><th>Balance</th><th>Dependency</th><th>Risk</th></tr></thead>
                  <tbody>
                    {data.countries.map((country) => (
                      <tr key={country.iso3} className="border-t border-slate-800">
                        <td className="py-3 text-white">{country.country}<span className="block text-xs text-slate-500">{country.iso3} · {country.region}</span></td>
                        <td>{formatMetric(country.imports_usd)}</td>
                        <td>{formatMetric(country.exports_usd)}</td>
                        <td className={country.exports_usd >= country.imports_usd ? "text-emerald-300" : "text-rose-300"}>{formatMetric(country.exports_usd - country.imports_usd)}</td>
                        <td>{country.dependency}%</td>
                        <td className="text-[#D6A85F]">{country.risk_exposure}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      ) : <p className="text-cyan-200">Loading country intelligence...</p>}
    </AppShell>
  );
}
