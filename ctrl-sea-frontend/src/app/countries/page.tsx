"use client";
import { useQuery } from "@tanstack/react-query";
import { Globe2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AreaPanel, BarPanel, HeatmapPanel } from "@/components/charts/analytics-charts";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type DataColumn } from "@/components/ui/data-table";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { endpoints } from "@/lib/api";
import type { CountryMetric } from "@/lib/types";
import { formatMetric, formatNumber } from "@/lib/utils";

export default function CountriesPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ["country-analytics"], queryFn: endpoints.countryAnalytics });
  const columns: DataColumn<CountryMetric>[] = [
    { key: "country", label: "Country", value: (row) => row.country, render: (row) => <div><span className="text-white">{row.country}</span><span className="block text-[10px] text-slate-500">{row.iso3} · {row.region}</span></div> },
    { key: "imports", label: "Imports", value: (row) => row.imports_usd, render: (row) => formatMetric(row.imports_usd), align: "right" },
    { key: "exports", label: "Exports", value: (row) => row.exports_usd, render: (row) => formatMetric(row.exports_usd), align: "right" },
    { key: "balance", label: "Balance", value: (row) => row.exports_usd-row.imports_usd, render: (row) => <span className={row.exports_usd>=row.imports_usd?"text-emerald-300":"text-rose-300"}>{formatMetric(row.exports_usd-row.imports_usd)}</span>, align: "right" },
    { key: "dependency", label: "Dependency", value: (row) => row.dependency, align: "right" },
    { key: "risk", label: "Risk", value: (row) => row.risk_exposure, render: (row) => formatNumber(row.risk_exposure), align: "right" }
  ];
  return <AppShell><div className="space-y-6"><PageHeader eyebrow="Country intelligence" title="Maritime Economy & Dependency" description="Compare national trade throughput, port dependency, and risk exposure." icon={Globe2}/>{isLoading && <LoadingState label="Loading country intelligence"/>}{error && <ErrorState/>}{data && <><div className="grid gap-4 xl:grid-cols-3"><AreaPanel title="Country Throughput Trend" data={data.trend}/><BarPanel title="Throughput Dependency" data={data.dependency} xKey="country"/><BarPanel title="Top Maritime Partners" data={data.partners} xKey="country"/></div><HeatmapPanel title="Country Risk Exposure" data={data.risk_exposure.map((row) => ({ country: row.country, risk: row.risk, region: "Maritime exposure" }))}/><div className="grid gap-4 xl:grid-cols-2"><BarPanel title="Import Throughput" data={data.trade_balance.map((row) => ({ name: row.country, value: row.imports }))}/><DataTable title="Country Intelligence Ranking" rows={data.countries} columns={columns} rowKey={(row) => row.iso3}/></div></>}</div></AppShell>;
}
