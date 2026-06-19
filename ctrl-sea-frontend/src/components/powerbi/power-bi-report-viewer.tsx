"use client";

import { useMemo } from "react";
import { secureEmbedUrl } from "@/components/powerbi/power-bi-utils";

type PowerBIReportViewerProps = {
  title: string;
  embedUrl: string;
  pageName?: string;
  filters?: Record<string, string>;
  theme?: "ctrl-sea-dark";
};

export function PowerBIReportViewer({ title, embedUrl, pageName, filters, theme = "ctrl-sea-dark" }: PowerBIReportViewerProps) {
  const source = useMemo(() => secureEmbedUrl(embedUrl, pageName, filters, theme), [embedUrl, filters, pageName, theme]);

  if (!source) {
    return <div className="rounded-md border border-rose-300/25 bg-rose-400/10 p-6 text-center text-rose-200">The Power BI embed URL is invalid or insecure.</div>;
  }

  return (
    <iframe
      title={title}
      src={source}
      className="h-[min(72vh,760px)] min-h-[520px] w-full rounded-md border border-cyan-300/20 bg-slate-950"
      allow="fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
    />
  );
}
