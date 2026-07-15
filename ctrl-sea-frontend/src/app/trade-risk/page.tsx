"use client";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { BarPanel } from "@/components/charts/analytics-charts";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { endpoints } from "@/lib/api";
import { formatMetric, formatNumber } from "@/lib/utils";

export default function TradeRiskPage(){const {data,isLoading,error}=useQuery({queryKey:["trade"],queryFn:endpoints.trade});return <AppShell><div className="space-y-6"><PageHeader eyebrow="Trade risk intelligence" title="Global Trade Exposure" description="Quantify capacity at risk, industry concentration, and expected port downtime." icon={ShieldAlert}/>{isLoading&&<LoadingState label="Calculating trade risk"/>}{error&&<ErrorState/>}{data&&<><div className="grid gap-4 xl:grid-cols-2"><BarPanel title="Trade Value at Risk" data={data.value_at_risk.map(x=>({name:x.industry,value:x.value}))}/><BarPanel title="Downtime Analysis" data={data.downtime.map(x=>({name:x.country,value:x.days}))}/></div><Card><CardTitle>Trade Flow Analysis</CardTitle><div className="mt-4 grid gap-3 md:grid-cols-2">{data.trade_flows.map(flow=><div key={`${flow.origin}-${flow.destination}`} className="rounded-lg border border-cyan-300/10 bg-slate-950/55 p-4 transition hover:border-cyan-300/25"><div className="flex items-center justify-between gap-3"><p className="font-medium text-white">{flow.origin} → {flow.destination}</p><span className="rounded-full bg-[#D6A85F]/10 px-2 py-1 font-mono text-xs text-[#F8E0AD]">{formatNumber(flow.risk)}</span></div><p className="mt-2 text-sm text-slate-400">{formatMetric(flow.value)} daily capacity at risk</p></div>)}</div></Card></>}</div></AppShell>}
