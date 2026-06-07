"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Sankey, Tooltip, Treemap, XAxis, YAxis } from "recharts";
import { Card, CardTitle } from "@/components/ui/card";

const palette = ["#30D5FF", "#60a5fa", "#D6A85F", "#34d399", "#fb7185", "#a78bfa"];

export function AreaPanel({ title, data, dataKey = "value" }: { title: string; data: Array<Record<string, string | number>>; dataKey?: string }) {
  return (
    <Card className="h-80">
      <CardTitle>{title}</CardTitle>
      <ResponsiveContainer width="100%" height="88%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`${title}-gradient`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.55} />
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,.12)" />
          <XAxis dataKey="month" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(34,211,238,.25)", borderRadius: 8 }} />
          <Area type="monotone" dataKey={dataKey} stroke="#22d3ee" fill={`url(#${title}-gradient)`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function BarPanel({ title, data, xKey = "name", yKey = "value" }: { title: string; data: Array<Record<string, string | number>>; xKey?: string; yKey?: string }) {
  return (
    <Card className="h-80">
      <CardTitle>{title}</CardTitle>
      <ResponsiveContainer width="100%" height="88%">
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(148,163,184,.12)" />
          <XAxis dataKey={xKey} stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(34,211,238,.25)", borderRadius: 8 }} />
          <Bar dataKey={yKey} radius={[6, 6, 0, 0]}>
            {data.map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function PiePanel({ title, data }: { title: string; data: Array<{ name: string; value: number }> }) {
  return (
    <Card className="h-80">
      <CardTitle>{title}</CardTitle>
      <ResponsiveContainer width="100%" height="88%">
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={62} outerRadius={96} paddingAngle={4}>
            {data.map((_, index) => <Cell key={index} fill={palette[index % palette.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(34,211,238,.25)", borderRadius: 8 }} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function TreemapPanel({ title, data }: { title: string; data: Array<{ name: string; value: number }> }) {
  return (
    <Card className="h-80">
      <CardTitle>{title}</CardTitle>
      <ResponsiveContainer width="100%" height="88%">
        <Treemap data={data} dataKey="value" nameKey="name" stroke="#03152D" fill="#30D5FF" />
      </ResponsiveContainer>
    </Card>
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
              <span className="text-sm text-cyan-100">{item.risk}</span>
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
        <p className="text-3xl font-semibold text-white">{value}</p>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
    </Card>
  );
}

export function LinePanel({ title, data, xKey = "month", yKey = "value" }: { title: string; data: Array<Record<string, string | number>>; xKey?: string; yKey?: string }) {
  return (
    <Card className="h-80">
      <CardTitle>{title}</CardTitle>
      <ResponsiveContainer width="100%" height="88%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(148,163,184,.12)" />
          <XAxis dataKey={xKey} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(34,211,238,.25)", borderRadius: 8 }} />
          <Line type="monotone" dataKey={yKey} stroke="#38bdf8" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function MultiLinePanel({ title, data, xKey = "month", series }: { title: string; data: Array<Record<string, string | number>>; xKey?: string; series: Array<{ key: string; label: string; color: string }> }) {
  return (
    <Card className="h-80">
      <CardTitle>{title}</CardTitle>
      <ResponsiveContainer width="100%" height="88%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(148,163,184,.12)" />
          <XAxis dataKey={xKey} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(34,211,238,.25)", borderRadius: 8 }} />
          <Legend />
          {series.map((item) => <Line key={item.key} type="monotone" name={item.label} dataKey={item.key} stroke={item.color} strokeWidth={2.4} dot={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function StackedAreaPanel({ title, data, xKey = "month", series }: { title: string; data: Array<Record<string, string | number>>; xKey?: string; series: Array<{ key: string; label: string; color: string }> }) {
  return (
    <Card className="h-80">
      <CardTitle>{title}</CardTitle>
      <ResponsiveContainer width="100%" height="88%">
        <AreaChart data={data}>
          <CartesianGrid stroke="rgba(148,163,184,.12)" />
          <XAxis dataKey={xKey} stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip contentStyle={{ background: "#020617", border: "1px solid rgba(34,211,238,.25)", borderRadius: 8 }} />
          <Legend />
          {series.map((item) => <Area key={item.key} type="monotone" stackId="1" name={item.label} dataKey={item.key} stroke={item.color} fill={item.color} fillOpacity={0.28} />)}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function SankeyPanel({ data }: { data: { nodes: Array<{ name: string }>; links: Array<{ source: string; target: string; value: number }> } }) {
  const nodeIndex = new Map(data.nodes.map((node, index) => [node.name, index]));
  const sankeyData = {
    nodes: data.nodes,
    links: data.links.map((link) => ({ source: nodeIndex.get(link.source) ?? 0, target: nodeIndex.get(link.target) ?? 0, value: link.value }))
  };
  return (
    <Card className="h-96">
      <CardTitle>Risk Propagation Sankey</CardTitle>
      <ResponsiveContainer width="100%" height="88%">
        <Sankey data={sankeyData} nodePadding={18} margin={{ top: 20, right: 20, bottom: 20, left: 20 }} link={{ stroke: "#22d3ee" }} />
      </ResponsiveContainer>
    </Card>
  );
}
