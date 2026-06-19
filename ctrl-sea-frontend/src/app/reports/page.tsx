"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PowerBIContainer } from "@/components/powerbi/power-bi-container";
import { endpoints } from "@/lib/api";

export default function ReportsPage() {
  const { data, error, isLoading } = useQuery({ queryKey: ["reports"], queryFn: endpoints.reports });
  return (
    <AppShell>
      <div className="space-y-5">
        {isLoading && <p className="text-cyan-200">Loading report configuration…</p>}
        {error && <p className="rounded-md border border-rose-300/25 bg-rose-400/10 p-4 text-rose-200">Unable to load reports.</p>}
        {data?.length === 0 && <div className="rounded-lg border border-cyan-300/15 bg-slate-950/50 p-8 text-center"><h2 className="text-xl font-semibold text-white">No Power BI reports configured</h2><p className="mt-2 text-sm text-slate-400">Add secure report metadata and embed-token configuration before publishing this workspace.</p></div>}
        {data && data.length > 0 && <PowerBIContainer reports={data} />}
      </div>
    </AppShell>
  );
}
