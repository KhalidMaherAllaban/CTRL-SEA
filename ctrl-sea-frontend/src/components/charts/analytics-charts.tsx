"use client";

import { useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Sankey, Tooltip, Treemap, XAxis, YAxis } from "recharts";
import { Download, Maximize2, X } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/card";
import { exportRows, formatMetric, formatNumber } from "@/lib/utils";

const palette = ["#30D5FF", "#60a5fa", "#D6A85F", "#34d399", "#fb7185", "#a78bfa"];
const axis = { stroke: "#64748b", fontSize: 10 };
const grid = { stroke: "rgba(148,163,184,.08)", strokeDasharray: "3 5" };
const tooltip = { contentStyle: { background: "rgba(2,6,23,.97)", border: "1px solid rgba(34,211,238,.25)", borderRadius: 10, boxShadow: "0 18px 60px rgba(0,0,0,.55)" }, labelStyle: { color: "#D6A85F" }, formatter: (value: unknown) => [formatNumber(Number(value), 2), "Value"] as [string, string] };

function ChartFrame({ title, data, children, className = "h-80" }: { title: string; data: Array<Record<string, unknown>>; children: ReactNode; className?: string }) {
  const [fullscreen, setFullscreen] = useState(false);
  return <Card className={`${className} relative flex flex-col overflow-hidden ${fullscreen ? "chart-fullscreen" : ""}`}><div className="mb-3 flex items-start justify-between gap-3"><div><CardTitle>{title}</CardTitle><p className="mt-1 text-[10px] uppercase tracking-[.16em] text-slate-600">Interactive warehouse visual</p></div><div className="flex gap-1"><button className="table-action" title="Export chart data" onClick={() => exportRows(title.toLowerCase().replace(/\s+/g, "-"), data)}><Download size={14}/></button><button className="table-action" title={fullscreen ? "Exit full screen" : "Full screen"} onClick={() => setFullscreen((value) => !value)}>{fullscreen ? <X size={14}/> : <Maximize2 size={14}/>}</button></div></div><div className="min-h-0 flex-1">{children}</div></Card>;
}

export function AreaPanel({ title, data, dataKey = "value" }: { title: string; data: Array<Record<string, string | number>>; dataKey?: string }) {
  return (
    <ChartFrame title={title} data={data}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`${title}-gradient`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.55} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid {...grid} />
          <XAxis dataKey="month" {...axis} tickLine={false} axisLine={false} />
          <YAxis {...axis} tickFormatter={formatMetric} tickLine={false} axisLine={false} width={48} />
          <Tooltip {...tooltip} />
          <Area type="monotone" dataKey={dataKey} stroke="#22d3ee" fill={`url(#${title}-gradient)`} strokeWidth={2.4} activeDot={{ r: 5, fill: "#D6A85F", stroke: "#020617" }} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function BarPanel({ title, data, xKey = "name", yKey = "value" }: { title: string; data: Array<Record<string, string | number>>; xKey?: string; yKey?: string }) {
  return (
    <ChartFrame title={title} data={data}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid {...grid} />
          <XAxis dataKey={xKey} {...axis} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis {...axis} tickFormatter={formatMetric} tickLine={false} axisLine={false} width={48} />
          <Tooltip {...tooltip} cursor={{ fill: "rgba(48,213,255,.05)" }} />
          <Bar dataKey={yKey} radius={[6, 6, 0, 0]}>
            {data.map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function PiePanel({ title, data }: { title: string; data: Array<{ name: string; value: number }> }) {
  return (
    <ChartFrame title={title} data={data}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={62} outerRadius={96} paddingAngle={4}>
            {data.map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}
          </Pie>
          <Tooltip {...tooltip} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 10, color: "#94a3b8" }} />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function TreemapPanel({ title, data }: { title: string; data: Array<{ name: string; value: number }> }) {
  return (
    <ChartFrame title={title} data={data}>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap data={data} dataKey="value" nameKey="name" stroke="#03152D" fill="#30D5FF" />
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function HeatmapPanel({ title, data }: { title: string; data: Array<{ country: string; region?: string; risk: number }> }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {data.map((item) => (
          <div key={item.country} className="rounded-md border border-cyan-300/10 p-3" style={{ background: `linear-gradient(135deg, rgba(48,213,255,${item.risk / 220}), rgba(214,168,95,${item.risk / 260}))` }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">{item.country}</p>
              <span className="font-mono text-sm text-cyan-100">{formatNumber(item.risk, 2)}</span>
            </div>
            <p className="mt-1 truncate text-xs text-slate-400">{item.region}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function GaugeCard({ title, value, subtitle }: { title: string; value: number; subtitle?: string }) {
  return (
    <Card className="h-56">
      <CardTitle>{title}</CardTitle>
      <ResponsiveContainer width="100%" height="70%">
        <RadialBarChart innerRadius="72%" outerRadius="100%" data={[{ name: title, value }]} startAngle={210} endAngle={-30}>
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={8} fill={value > 70 ? "#fb7185" : value > 55 ? "#D6A85F" : "#30D5FF"} background={{ fill: "rgba(148,163,184,.12)" }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="-mt-8 text-center">
        <p className="font-mono text-3xl font-semibold text-white">{formatNumber(value, 1)}</p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </Card>
  );
}

export function LinePanel({ title, data, xKey = "month", yKey = "value" }: { title: string; data: Array<Record<string, string | number>>; xKey?: string; yKey?: string }) {
  return (
    <ChartFrame title={title} data={data}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid {...grid} />
          <XAxis dataKey={xKey} {...axis} tickLine={false} axisLine={false} />
          <YAxis {...axis} tickFormatter={formatMetric} tickLine={false} axisLine={false} width={48} />
          <Tooltip {...tooltip} />
          <Line type="monotone" dataKey={yKey} stroke="#38bdf8" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "#D6A85F" }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function MultiLinePanel({ title, data, xKey = "month", series }: { title: string; data: Array<Record<string, string | number>>; xKey?: string; series: Array<{ key: string; label: string; color: string }> }) {
  return (
    <ChartFrame title={title} data={data}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid {...grid} /><XAxis dataKey={xKey} {...axis} tickLine={false} axisLine={false} /><YAxis {...axis} tickFormatter={formatMetric} tickLine={false} axisLine={false} width={48} /><Tooltip {...tooltip} /><Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
          {series.map((item) => <Line key={item.key} type="monotone" name={item.label} dataKey={item.key} stroke={item.color} strokeWidth={2.4} dot={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function StackedAreaPanel({ title, data, xKey = "month", series }: { title: string; data: Array<Record<string, string | number>>; xKey?: string; series: Array<{ key: string; label: string; color: string }> }) {
  return (
    <ChartFrame title={title} data={data}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid {...grid} /><XAxis dataKey={xKey} {...axis} tickLine={false} axisLine={false} /><YAxis {...axis} tickFormatter={formatMetric} tickLine={false} axisLine={false} width={48} /><Tooltip {...tooltip} /><Legend iconType="circle" wrapperStyle={{ fontSize: 10 }} />
          {series.map((item) => <Area key={item.key} type="monotone" stackId="1" name={item.label} dataKey={item.key} stroke={item.color} fill={item.color} fillOpacity={0.28} />)}
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function SankeyPanel({ data }: { data: { nodes: Array<{ name: string }>; links: Array<{ source: string; target: string; value: number }> } }) {
  const layeredNodes = new Map<string, number>();
  const nodes: Array<{ name: string }> = [];

  function getLayeredNodeIndex(layer: "source" | "target", name: string) {
    const key = `${layer}:${name}`;
    const existingIndex = layeredNodes.get(key);
    if (existingIndex !== undefined) return existingIndex;
    const nextIndex = nodes.length;
    layeredNodes.set(key, nextIndex);
    nodes.push({ name });
    return nextIndex;
  }

  const sankeyData = {
    nodes,
    links: data.links
      .filter((link) => Number.isFinite(link.value) && link.value > 0)
      .map((link) => ({
        source: getLayeredNodeIndex("source", link.source),
        target: getLayeredNodeIndex("target", link.target),
        value: link.value
      }))
  };
  return (
    <ChartFrame title="Risk Propagation Sankey" data={data.links} className="h-96">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey data={sankeyData} nodePadding={18} margin={{ top: 20, right: 20, bottom: 20, left: 20 }} link={{ stroke: "#22d3ee" }} />
      </ResponsiveContainer>
    </ChartFrame>
  );
}
