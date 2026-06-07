"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PowerBiFrame } from "@/components/powerbi/power-bi-frame";
import { endpoints } from "@/lib/api";

export default function ReportsPage() {
  const { data } = useQuery({ queryKey: ["reports"], queryFn: endpoints.reports });
  return (
    <AppShell>
      <div className="space-y-5">
        {data?.map((report) => <PowerBiFrame key={report.id} title={report.title} embedUrl={report.embed_url} />)}
      </div>
    </AppShell>
  );
}
