import { AlertTriangle, Database, LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Loading maritime intelligence" }: { label?: string }) {
  return <div className="glass flex min-h-52 items-center justify-center rounded-xl"><div className="text-center"><LoaderCircle className="mx-auto animate-spin text-cyan-300" /><p className="mt-3 text-xs uppercase tracking-[0.2em] text-cyan-100">{label}</p></div></div>;
}
export function ErrorState({ label = "Intelligence service is unavailable" }: { label?: string }) {
  return <div role="alert" className="flex min-h-40 items-center justify-center rounded-xl border border-rose-300/20 bg-rose-400/5 p-6 text-center"><div><AlertTriangle className="mx-auto text-rose-300" /><p className="mt-3 text-sm text-rose-100">{label}</p></div></div>;
}
export function EmptyState({ label = "No records match the current filters" }: { label?: string }) {
  return <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-cyan-300/15 bg-slate-950/25 p-6 text-center"><div><Database className="mx-auto text-slate-600" /><p className="mt-3 text-sm text-slate-400">{label}</p></div></div>;
}
