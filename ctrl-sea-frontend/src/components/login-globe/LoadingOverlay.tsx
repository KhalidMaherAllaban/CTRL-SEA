"use client";

import { Loader2 } from "lucide-react";

export function LoadingOverlay({ label = "Initializing Esri maritime globe" }: { label?: string }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#020617] text-cyan-100">
      <div className="rounded-md border border-cyan-300/15 bg-slate-950/70 px-5 py-4 text-center shadow-[0_0_80px_rgba(48,213,255,.18)] backdrop-blur-xl">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#30D5FF]" />
        <p className="mt-3 text-xs uppercase tracking-[0.24em]">{label}</p>
      </div>
    </div>
  );
}
