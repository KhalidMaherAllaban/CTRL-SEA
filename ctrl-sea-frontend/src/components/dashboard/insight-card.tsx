import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export function InsightCard({ label, title, value, detail, icon: Icon, tone = "cyan" }: { label: string; title: string; value: string; detail?: string; icon: LucideIcon; tone?: "cyan" | "gold" | "rose" | "emerald" }) {
  const tones = { cyan: "text-cyan-200 bg-cyan-300/10 border-cyan-300/20", gold: "text-[#F8E0AD] bg-[#D6A85F]/10 border-[#D6A85F]/20", rose: "text-rose-200 bg-rose-400/10 border-rose-300/20", emerald: "text-emerald-200 bg-emerald-400/10 border-emerald-300/20" };
  return <Card className="relative overflow-hidden"><div className="flex items-start justify-between gap-3"><span className={`rounded-lg border p-2.5 ${tones[tone]}`}><Icon size={18} /></span><ArrowUpRight size={16} className="text-slate-600 transition group-hover/card:text-cyan-300" /></div><p className="mt-5 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">{label}</p><h3 className="mt-1 truncate text-base font-semibold text-white">{title}</h3><p className="mt-3 font-mono text-2xl font-semibold text-cyan-100">{value}</p>{detail && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{detail}</p>}</Card>;
}
