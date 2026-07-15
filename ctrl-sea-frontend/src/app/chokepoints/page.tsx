"use client";
import { useQuery } from "@tanstack/react-query";
import { RadioTower } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { BarPanel, GaugeCard, LinePanel } from "@/components/charts/analytics-charts";
import { PageHeader } from "@/components/dashboard/page-header";
import { DataTable, type DataColumn } from "@/components/ui/data-table";
import { endpoints } from "@/lib/api";
import { formatMetric, formatNumber, formatPercent } from "@/lib/utils";
import type { Chokepoint } from "@/lib/types";
type Row=Chokepoint&{congestion:number;trade_impact_usd:number};

export default function ChokepointsPage(){const {data}=useQuery({queryKey:["chokepoint-analytics"],queryFn:endpoints.chokepointAnalytics});const columns:DataColumn<Row>[]=[{key:"name",label:"Corridor",value:r=>r.chokepoint_name,render:r=><span className="text-white">{r.chokepoint_name}</span>},{key:"region",label:"Region",value:r=>r.region},{key:"traffic",label:"Traffic",value:r=>r.vessel_transits,render:r=>formatMetric(r.vessel_transits),align:"right"},{key:"congestion",label:"Congestion",value:r=>r.congestion,render:r=>formatPercent(r.congestion),align:"right"},{key:"impact",label:"Trade impact",value:r=>r.trade_impact_usd,render:r=><span className="text-cyan-100">{formatMetric(r.trade_impact_usd)}</span>,align:"right"},{key:"risk",label:"Risk",value:r=>r.risk_score,render:r=>formatNumber(r.risk_score),align:"right"}];return <AppShell><div className="space-y-6"><PageHeader eyebrow="Strategic corridor intelligence" title="Global Chokepoint Monitor" description="Track traffic pressure, congestion, and trade exposure at the world's critical maritime passages." icon={RadioTower}/><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{data?.items.slice(0,4).map((item:Row)=><GaugeCard key={item.chokepoint_code} title={item.chokepoint_name} value={item.risk_score} subtitle={`${formatPercent(item.congestion)} congestion`}/>)}</div>{data&&<><div className="grid gap-4 xl:grid-cols-3"><BarPanel title="Daily Vessel Transits" data={data.transits}/><BarPanel title="Chokepoint Risk Index" data={data.risk} yKey="risk"/><BarPanel title="Transit Capacity" data={data.trade_impact}/></div><div className="grid gap-4 xl:grid-cols-2"><BarPanel title="Congestion Pressure" data={data.congestion}/><LinePanel title="Historical Traffic" data={data.history}/></div></>}<DataTable title="Strategic Corridor Brief" rows={data?.items??[]} columns={columns} rowKey={row=>row.chokepoint_code}/></div></AppShell>}
