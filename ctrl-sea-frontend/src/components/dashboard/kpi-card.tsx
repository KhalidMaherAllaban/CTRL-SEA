"use client";

import { motion } from "framer-motion";
import { Activity, Anchor, ArrowDownRight, ArrowUpRight, CloudLightning, Globe2, Info, RadioTower, ShieldAlert, Ship, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { formatMetric, formatNumber } from "@/lib/utils";

const iconByLabel = [
  ["Port Calls", Activity], ["Ports", Anchor], ["Countries", Globe2], ["Trade Volume", TrendingUp], ["Disruptions", ShieldAlert], ["Chokepoints", RadioTower], ["Climate", CloudLightning], ["Trade", Ship]
] as const;

function displayValue(value: number | string, prefix = "", suffix = "") {
  if (typeof value !== "number") return `${prefix}${value}${suffix}`;
  const formatted = Math.abs(value) >= 1000 ? formatMetric(value) : formatNumber(value, value % 1 ? 2 : 0);
  return `${prefix}${formatted}${suffix}`;
}

function useAnimatedNumber(value: number | string) {
  const [display, setDisplay] = useState(typeof value === "number" ? 0 : value);

  useEffect(() => {
    if (typeof value !== "number") {
      setDisplay(value);
      return;
    }
    let frame = 0;
    const frames = 28;
    const timer = window.setInterval(() => {
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / frames, 3);
      setDisplay(value * Math.min(progress, 1));
      if (frame >= frames) window.clearInterval(timer);
    }, 18);
    return () => window.clearInterval(timer);
  }, [value]);

  return display;
}

export function KpiCard({
  label,
  value,
  prefix,
  suffix,
  change,
  weekly_change,
  tooltip,
  sparkline,
  index = 0,
  active = false,
  onClick
}: {
  label: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  change: number;
  weekly_change: number;
  tooltip: string;
  sparkline: number[];
  index?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const Icon = iconByLabel.find(([token]) => label.includes(token))?.[1] ?? Activity;
  const positive = change > 0;
  const negative = change < 0;
  const animatedValue = useAnimatedNumber(value);
  const series = useMemo(() => sparkline.length > 1 ? sparkline : [Number(value) || 0, Number(value) || 0], [sparkline, value]);
  const min = Math.min(...series); const max = Math.max(...series);
  const points = series.map((point, pointIndex) => `${(pointIndex / Math.max(1, series.length - 1)) * 160},${42 - ((point - min) / Math.max(1, max - min)) * 34}`).join(" ");
  const status = negative && Math.abs(change) > 8 ? "Critical" : negative ? "Warning" : "Healthy";
  const statusColor = status === "Critical" ? "#fb7185" : status === "Warning" ? "#D6A85F" : "#34d399";
  const progress = useMemo(() => {
    const last = Math.abs(series.at(-1) ?? 0);
    const high = Math.max(...series.map((item) => Math.abs(item)), 1);
    return Math.max(8, Math.min(96, (last / high) * 100));
  }, [series]);

  return <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .4, delay: Math.min(index * .035, .3) }}>
    <Card
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onClick();
        }
      }}
      className={`intelligence-noise relative min-h-[224px] overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/35 hover:shadow-[0_28px_100px_rgba(0,0,0,.58),0_0_34px_rgba(48,213,255,.12)] ${active ? "border-cyan-300/45 shadow-[0_0_34px_rgba(48,213,255,.16)]" : ""} ${onClick ? "cursor-pointer" : ""}`}
      title={tooltip}
    >
      <div className={`absolute inset-x-0 top-0 h-0.5 ${negative ? "bg-rose-400" : positive ? "bg-emerald-400" : "bg-cyan-300"}`} />
      <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full blur-3xl" style={{ backgroundColor: `${statusColor}22` }} />
      <div className="relative p-5"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="rounded-lg border border-cyan-300/15 bg-cyan-300/8 p-2.5 text-cyan-200"><Icon size={18} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p><span className={`mt-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider ${negative ? "text-rose-300" : positive ? "text-emerald-300" : "text-cyan-300"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status}</span></div></div><span title={tooltip} className="text-slate-600"><Info size={14} /></span></div>
        <div className="mt-5 flex items-end justify-between gap-3">
          <p className="font-mono text-3xl font-semibold tracking-tight text-white">{displayValue(animatedValue, prefix, suffix)}</p>
          <svg viewBox="0 0 44 44" className="h-12 w-12" aria-hidden="true">
            <circle cx="22" cy="22" r="17" fill="none" stroke="rgba(148,163,184,.14)" strokeWidth="5" />
            <circle cx="22" cy="22" r="17" fill="none" stroke={statusColor} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${progress} 100`} pathLength="100" transform="rotate(-90 22 22)" />
          </svg>
        </div>
        <svg className="mt-3 h-11 w-full overflow-visible" viewBox="0 0 160 46" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id={`spark-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={negative ? "#fb7185" : "#30D5FF"} stopOpacity=".28"/><stop offset="1" stopColor={negative ? "#fb7185" : "#30D5FF"} stopOpacity="0"/></linearGradient></defs><polygon points={`0,46 ${points} 160,46`} fill={`url(#spark-${index})`} /><polyline points={points} fill="none" stroke={negative ? "#fb7185" : "#30D5FF"} strokeWidth="2" vectorEffect="non-scaling-stroke" /></svg>
      </div>
      <div className="grid grid-cols-2 divide-x divide-cyan-300/10 border-t border-cyan-300/10 bg-slate-950/25"><Trend label="MoM" value={change} /><Trend label="YoY" value={weekly_change} /></div>
    </Card>
  </motion.div>;
}

function Trend({ label, value }: { label: string; value: number }) { const up = value >= 0; return <div className="flex items-center justify-between px-4 py-2.5 text-[11px]"><span className="text-slate-500">{label}</span><span className={`flex items-center gap-1 font-mono ${value === 0 ? "text-slate-400" : up ? "text-emerald-300" : "text-rose-300"}`}>{up ? <ArrowUpRight size={13}/> : <ArrowDownRight size={13}/>} {Math.abs(value).toFixed(1)}%</span></div>; }
