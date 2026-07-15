"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Anchor, Search } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { AreaPanel, BarPanel, LinePanel } from "@/components/charts/analytics-charts";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type DataColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { endpoints } from "@/lib/api";
import type { Port } from "@/lib/types";
import { formatMetric } from "@/lib/utils";

export default function PortsPage() {
  const [search,setSearch]=useState(""); const [country,setCountry]=useState("");
  const { data }=useQuery({queryKey:["ports",search,country],queryFn:()=>endpoints.ports({search,country,size:50})});
  const analytics=useQuery({queryKey:["port-analytics"],queryFn:endpoints.portAnalytics});
  const columns: DataColumn<Port>[]=[{key:"port",label:"Port",value:(r)=>r.port_name,render:(r)=><div><span className="text-white">{r.port_name}</span><span className="block font-mono text-[10px] text-slate-500">{r.port_code}</span></div>},{key:"type",label:"Region",value:(r)=>r.port_type},{key:"calls",label:"Port calls",value:(r)=>r.vessel_count,render:(r)=>formatMetric(r.vessel_count),align:"right"},{key:"throughput",label:"Throughput",value:(r)=>r.trade_value_usd,render:(r)=><span className="text-cyan-100">{formatMetric(r.trade_value_usd)}</span>,align:"right"},{key:"risk",label:"Risk",value:(r)=>r.risk_score,align:"right"}];
  return <AppShell><div className="space-y-6"><PageHeader eyebrow="Port intelligence" title="Global Port Performance" description="Search, compare, and rank operational throughput across 2,000+ warehouse ports." icon={Anchor}/><div className="grid gap-3 rounded-xl border border-cyan-300/15 bg-slate-950/45 p-3 lg:grid-cols-[1fr_260px_180px]"><div className="flex items-center gap-2 rounded-lg border border-cyan-300/10 bg-slate-950/70 px-3"><Search size={16} className="text-slate-500"/><Input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search ports or UN/LOCODE" className="border-0 bg-transparent"/></div><Input value={country} onChange={(e)=>setCountry(e.target.value)} placeholder="Country filter"/><Input value="Last 30 days" readOnly/></div>{analytics.data && <><div className="grid gap-4 xl:grid-cols-3"><AreaPanel title="Import Trend" data={analytics.data.import_trend}/><AreaPanel title="Export Trend" data={analytics.data.export_trend}/><LinePanel title="Congestion Trend" data={analytics.data.congestion_trend}/></div><div className="grid gap-4 xl:grid-cols-3"><BarPanel title="Port Performance" data={analytics.data.performance} yKey="score"/><BarPanel title="Vessel Arrivals" data={analytics.data.arrivals_departures} yKey="arrivals"/><BarPanel title="Vessel Departures" data={analytics.data.arrivals_departures} yKey="departures"/></div></>}<DataTable title="Port Intelligence Ranking" rows={data?.items??[]} columns={columns} rowKey={(row)=>row.port_code}/></div></AppShell>;
}
