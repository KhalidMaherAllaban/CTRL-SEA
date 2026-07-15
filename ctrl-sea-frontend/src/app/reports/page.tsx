"use client";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Download, ExternalLink, FileBarChart2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { PowerBIContainer } from "@/components/powerbi/power-bi-container";
import { Card, CardTitle } from "@/components/ui/card";
import { ErrorState, LoadingState } from "@/components/ui/data-state";
import { endpoints } from "@/lib/api";

const localPbixUrl = "/reports/ctrl-sea-dashboard.pbix";

function LocalPbixDashboard() {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 lg:grid-cols-[.74fr_.26fr]">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-md border border-[#D6A85F]/30 bg-[#D6A85F]/10 p-3 text-[#F8E0AD]">
              <FileBarChart2 size={26} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[#D6A85F]">Local PBIX dashboard</p>
              <CardTitle className="mt-2">CTRL SEA Power BI Dashboard</CardTitle>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                The uploaded Power BI Desktop report is available from this workspace. Browsers cannot render a raw PBIX interactively; publish it to Power BI Service or Power BI Embedded and add its secure embed URL to enable the live iframe experience below.
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href={localPbixUrl} download className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300/25 bg-cyan-300/10 px-4 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/18">
              <Download size={16} /> Download PBIX
            </a>
            <a href={localPbixUrl} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-700 bg-slate-950/60 px-4 text-sm font-medium text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-100">
              <ExternalLink size={16} /> Open file
            </a>
          </div>
        </div>
        <div className="border-t border-cyan-300/10 bg-slate-950/45 p-6 lg:border-l lg:border-t-0">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Publish path</p>
          <ol className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <li>1. Open the PBIX in Power BI Desktop.</li>
            <li>2. Publish to Power BI Service.</li>
            <li>3. Copy the secure report embed URL.</li>
            <li>4. Add it to <span className="font-mono text-cyan-100">POWER_BI_REPORTS_JSON</span>.</li>
          </ol>
        </div>
      </div>
    </Card>
  );
}

export default function ReportsPage() {
  const { data, error, isLoading } = useQuery({ queryKey: ["reports"], queryFn: endpoints.reports });
  const hasEmbeddedReports = Boolean(data?.length);

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader eyebrow="Embedded analytics" title="Power BI Intelligence Center" description="Enterprise reports, cross-filtered dashboards, and drill-through analytical workspaces." icon={BarChart3} />
        {isLoading && <LoadingState label="Loading report configuration" />}
        {error && <ErrorState label="Unable to load reports" />}
        {!isLoading && !error && <LocalPbixDashboard />}
        {hasEmbeddedReports && <PowerBIContainer reports={data!} />}
      </div>
    </AppShell>
  );
}
