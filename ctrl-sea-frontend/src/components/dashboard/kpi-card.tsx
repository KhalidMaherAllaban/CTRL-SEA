"use client";

import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import { Card } from "@/components/ui/card";

export function KpiCard({ label, value, prefix, suffix, change, weekly_change, tooltip, sparkline }: { label: string; value: number | string; prefix?: string; suffix?: string; change: number; weekly_change: number; tooltip: string; sparkline: number[] }) {
  const positive = change >= 0;
  const points = sparkline.map((point, index) => {
    const min = Math.min(...sparkline);
    const max = Math.max(...sparkline);
    const x = (index / Math.max(1, sparkline.length - 1)) * 120;
    const y = 36 - ((point - min) / Math.max(1, max - min)) * 30;
    return `${x},${y}`;
  }).join(" ");
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <Card className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <span title={tooltip} className="text-slate-500 hover:text-cyan-100"><Info size={14} /></span>
        </div>
        <div className="mt-4 flex items-end justify-between gap-4">
          <p className="text-3xl font-semibold text-white">{prefix}{value}{suffix}</p>
          <span className={`flex items-center gap-1 text-sm ${positive ? "text-emerald-300" : "text-rose-300"}`}>
            {positive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            {Math.abs(change)}% D
          </span>
        </div>
        <svg className="mt-4 h-10 w-full" viewBox="0 0 120 40" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={points} fill="none" stroke={positive ? "#30D5FF" : "#fb7185"} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
          <span>Weekly</span>
          <span className={weekly_change >= 0 ? "text-emerald-300" : "text-rose-300"}>{weekly_change >= 0 ? "+" : ""}{weekly_change}%</span>
        </div>
      </Card>
    </motion.div>
  );
}
