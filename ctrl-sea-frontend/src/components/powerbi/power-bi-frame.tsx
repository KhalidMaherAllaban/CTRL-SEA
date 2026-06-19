import { Card, CardTitle } from "@/components/ui/card";
import { PowerBIReportViewer } from "@/components/powerbi/power-bi-report-viewer";

export function PowerBiFrame({ title, embedUrl }: { title: string; embedUrl: string }) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>{title}</CardTitle>
          <p className="mt-1 text-xs text-slate-500">Secure embed shell with CTRL SEA dark theme and synced global filters.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded border border-cyan-300/15 px-2 py-1 text-cyan-100">Theme sync</span>
          <span className="rounded border border-cyan-300/15 px-2 py-1 text-cyan-100">Filter sync</span>
          <span className="rounded border border-[#D6A85F]/30 px-2 py-1 text-[#D6A85F]">AAD token required</span>
        </div>
      </div>
      <div className="mt-4"><PowerBIReportViewer title={title} embedUrl={embedUrl} /></div>
    </Card>
  );
}
