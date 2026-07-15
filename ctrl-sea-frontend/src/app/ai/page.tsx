"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, BrainCircuit, FileText, Globe2, Loader2, Send, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { endpoints } from "@/lib/api";
import type { DashboardOverview, ExecutiveInsights } from "@/lib/types";

type Message = { role: "user" | "assistant"; text: string };
type PortPerformance = { name: string; score: number };
type PortTraffic = { name: string; arrivals: number; departures: number };
type PortAnalytics = {
  performance?: PortPerformance[];
  arrivals_departures?: PortTraffic[];
};
type WebhookPayload = string | { formatted_response?: string; answer?: string; response?: string; message?: string } | Array<{ formatted_response?: string; answer?: string; response?: string; message?: string }>;

const AI_WEBHOOK_URL = process.env.NEXT_PUBLIC_AI_WEBHOOK_URL ?? "https://adwshh2003.app.n8n.cloud/webhook-test/ctrlsea-chat";

const suggestedPrompts = [
  "What is the best port?",
  "Summarize today's highest maritime risk corridors.",
  "Which chokepoints should operations monitor first?",
  "Explain spillover impact if Suez capacity drops by 30%.",
  "Create an executive brief for port congestion risk."
];

const capabilities = [
  { title: "Risk Intelligence", detail: "Interpret route, chokepoint, disruption, and trade-risk signals.", icon: ShieldAlert },
  { title: "Executive Briefs", detail: "Turn warehouse analytics into concise leadership-ready summaries.", icon: FileText },
  { title: "Scenario Reasoning", detail: "Structure questions around spillover, climate, and supply-chain scenarios.", icon: BrainCircuit },
  { title: "Global Context", detail: "Connect port, country, and corridor context across CTRL SEA pages.", icon: Globe2 }
];

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const compactFormatter = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

function formatNumber(value: number | undefined) {
  return numberFormatter.format(Number(value ?? 0));
}

function formatMetric(value: number | undefined) {
  return compactFormatter.format(Number(value ?? 0));
}

function normalizePrompt(prompt: string) {
  return prompt.toLowerCase().replace(/[^\w\s]/g, " ");
}

function htmlishToText(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<\/?[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function extractWebhookAnswer(data: WebhookPayload) {
  if (typeof data === "string") return htmlishToText(data);
  const value = Array.isArray(data) ? data[0] : data;
  return htmlishToText(value?.formatted_response ?? value?.answer ?? value?.response ?? value?.message ?? "");
}

async function askWebhook(prompt: string) {
  const response = await fetch(AI_WEBHOOK_URL, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ message: prompt })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`AI service returned ${response.status}: ${detail || response.statusText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const answer = extractWebhookAnswer(await response.json() as WebhookPayload);
    if (answer) return answer;
  } else {
    const text = await response.text();
    try {
      const answer = extractWebhookAnswer(JSON.parse(text) as WebhookPayload);
      if (answer) return answer;
    } catch {
      const answer = htmlishToText(text);
      if (answer) return answer;
    }
  }

  throw new Error("AI service returned an empty response");
}

async function loadAiContext() {
  const [dashboardResult, insightsResult, portAnalyticsResult] = await Promise.allSettled([
    endpoints.dashboard(),
    endpoints.insights(),
    endpoints.portAnalytics()
  ]);

  return {
    dashboard: dashboardResult.status === "fulfilled" ? dashboardResult.value : undefined,
    insights: insightsResult.status === "fulfilled" ? insightsResult.value : undefined,
    portAnalytics: portAnalyticsResult.status === "fulfilled" ? portAnalyticsResult.value as PortAnalytics : undefined
  };
}

function bestPortAnswer(portAnalytics?: PortAnalytics, insights?: ExecutiveInsights, dashboard?: DashboardOverview) {
  const topPerformance = [...(portAnalytics?.performance ?? [])].sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))[0];
  const topTraffic = [...(portAnalytics?.arrivals_departures ?? [])].sort((a, b) => Number((b.arrivals ?? 0) + (b.departures ?? 0)) - Number((a.arrivals ?? 0) + (a.departures ?? 0)))[0];
  const fastestGrowing = insights?.fastest_growing_ports?.[0];
  const rankedPort = dashboard?.port_rankings?.[0];

  const primaryName = topPerformance?.name ?? fastestGrowing?.port_name ?? rankedPort?.port_name ?? "the top-ranked warehouse port";
  const trafficNote = topTraffic ? `Traffic leader: ${topTraffic.name} with ${formatMetric(topTraffic.arrivals + topTraffic.departures)} combined arrivals/departures.` : "";
  const growthNote = fastestGrowing ? `Fastest growth signal: ${fastestGrowing.port_name}, ${fastestGrowing.country}, at +${formatNumber(fastestGrowing.growth)}%.` : "";
  const rankingNote = rankedPort ? `Dashboard ranking also highlights ${rankedPort.port_name}${rankedPort.country ? `, ${rankedPort.country}` : ""} with risk score ${formatNumber(rankedPort.risk_score)} and trade value ${formatMetric(rankedPort.trade_value_usd)}.` : "";

  return [
    `Best port by current CTRL SEA operating performance is ${primaryName}${topPerformance ? `, with a performance score of ${formatNumber(topPerformance.score)}` : ""}.`,
    trafficNote,
    growthNote,
    rankingNote,
    "Recommendation: treat this as the best operational port in the current warehouse view, then validate against your business goal: throughput, low risk, growth, or strategic location."
  ].filter(Boolean).join("\n\n");
}

function riskAnswer(insights?: ExecutiveInsights) {
  const routes = insights?.highest_risk_routes?.slice(0, 3) ?? [];
  const countries = insights?.highest_risk_countries?.slice(0, 3) ?? [];
  if (!routes.length && !countries.length) return "I could not load risk intelligence from the warehouse right now. Check the backend session and try again.";

  return [
    "Highest maritime risk signals in the current warehouse view:",
    ...routes.map((route, index) => `${index + 1}. ${route.origin} to ${route.destination}: risk ${formatNumber(route.risk)}, value at exposure ${formatMetric(route.value)}.`),
    ...countries.map((country, index) => `Country exposure ${index + 1}: ${country.country} in ${country.region}, risk exposure ${formatNumber(country.risk_exposure)}.`)
  ].join("\n");
}

function chokepointAnswer(insights?: ExecutiveInsights) {
  const chokepoints = insights?.most_critical_chokepoints?.slice(0, 5) ?? [];
  if (!chokepoints.length) return "I could not load chokepoint intelligence from the warehouse right now. Check the backend session and try again.";

  return [
    "Priority chokepoints to monitor:",
    ...chokepoints.map((item, index) => `${index + 1}. ${item.chokepoint_name}: ${formatMetric(item.vessel_transits)} recent vessel transits, risk score ${formatNumber(item.risk_score)}${item.congestion ? `, congestion ${formatNumber(item.congestion)}` : ""}.`),
    "Operational focus: watch any chokepoint where high transit volume and elevated risk overlap."
  ].join("\n");
}

function executiveBriefAnswer(insights?: ExecutiveInsights) {
  const narratives = insights?.narratives?.slice(0, 4) ?? [];
  if (!narratives.length) return "I could not load executive insight narratives from the warehouse right now. Check the backend session and try again.";

  return [
    "Executive brief:",
    ...narratives.map((item) => `- ${item}`),
    "Decision lens: prioritize routes and ports where congestion, trade value, and risk concentration appear together."
  ].join("\n");
}

function spilloverAnswer(insights?: ExecutiveInsights) {
  const effects = insights?.largest_spillover_effects?.slice(0, 4) ?? [];
  if (!effects.length) return "I could not load spillover intelligence from the warehouse right now. Check the backend session and try again.";

  return [
    "Largest spillover signals currently visible:",
    ...effects.map((item, index) => `${index + 1}. ${item.source} to ${item.destination}: ${item.industry}, impact ${formatMetric(item.impact)}.`),
    "For a Suez capacity drop scenario, start by checking affected corridors, destination countries, and industries with the highest propagated capacity impact."
  ].join("\n");
}

async function generateAnswer(prompt: string) {
  const normalized = normalizePrompt(prompt);
  const { dashboard, insights, portAnalytics } = await loadAiContext();

  if (normalized.includes("best") && normalized.includes("port")) return bestPortAnswer(portAnalytics, insights, dashboard);
  if (normalized.includes("chokepoint") || normalized.includes("suez") || normalized.includes("panama") || normalized.includes("hormuz")) return chokepointAnswer(insights);
  if (normalized.includes("spillover") || normalized.includes("capacity drop") || normalized.includes("supply")) return spilloverAnswer(insights);
  if (normalized.includes("risk") || normalized.includes("corridor")) return riskAnswer(insights);
  if (normalized.includes("brief") || normalized.includes("summary") || normalized.includes("executive") || normalized.includes("congestion")) return executiveBriefAnswer(insights);

  return executiveBriefAnswer(insights);
}

export default function AiPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Welcome to CTRL SEA AI. Ask me anything about maritime analytics, routes, risks, ports, vessels, transit times, imports, and exports."
    }
  ]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [loading, messages]);

  async function submitPrompt() {
    const value = prompt.trim();
    if (!value || loading) return;
    setMessages((current) => [...current, { role: "user", text: value }]);
    setPrompt("");
    setLoading(true);

    try {
      let answer: string;
      try {
        answer = await askWebhook(value);
      } catch {
        answer = await generateAnswer(value);
      }
      setMessages((current) => [...current, { role: "assistant", text: answer }]);
    } catch {
      setMessages((current) => [...current, { role: "assistant", text: "Connection Error. I could not reach the CTRL SEA AI service or warehouse fallback. Confirm the backend is running and try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <PageHeader
          eyebrow="AI copilot"
          title="Maritime Intelligence Assistant"
          description="Ask questions about routes, risks, ports, vessels, transit times, imports, exports, and executive maritime analytics."
          icon={Bot}
        />

        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
          <Card className="min-h-[640px] overflow-hidden p-0 shadow-[0_26px_90px_rgba(0,0,0,.34)]">
            <div className="border-b border-cyan-300/10 p-5">
              <CardTitle>CTRL SEA AI</CardTitle>
              <p className="mt-2 text-sm text-slate-400">Powered by the CTRL SEA AI workflow, with warehouse intelligence fallback for core operational questions.</p>
            </div>

            <div className="flex min-h-[440px] flex-col gap-4 overflow-y-auto p-5">
              {messages.map((message, index) => (
                <div key={`${message.role}-${index}`} className={`max-w-[82%] whitespace-pre-line rounded-[18px] border px-5 py-3 text-sm leading-6 shadow-lg ${message.role === "user" ? "ml-auto rounded-br-md border-cyan-200/20 bg-gradient-to-br from-cyan-300 to-sky-400 text-slate-950 shadow-cyan-950/20" : "rounded-bl-md border-cyan-300/12 bg-[#082D56]/55 text-slate-200"}`}>
                  {message.text}
                </div>
              ))}
              {loading && (
                <div className="flex max-w-[82%] items-center gap-2 rounded-[18px] rounded-bl-md border border-cyan-300/12 bg-[#082D56]/55 px-5 py-3 text-sm text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin text-cyan-200" /> Thinking with CTRL SEA AI...
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-cyan-300/10 bg-[#03152D]/90 p-4">
              <div className="flex gap-2">
                <input
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      submitPrompt();
                    }
                  }}
                  placeholder="Ask CTRL SEA AI..."
                  className="h-12 flex-1 rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/10"
                />
                <Button type="button" disabled={loading} onClick={submitPrompt} className="h-12 rounded-xl px-5">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={16} />} Send
                </Button>
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardTitle>Suggested Prompts</CardTitle>
              <div className="mt-4 space-y-2">
                {suggestedPrompts.map((item) => (
                  <button key={item} type="button" onClick={() => setPrompt(item)} className="w-full rounded-md border border-cyan-300/10 bg-slate-950/55 px-3 py-2 text-left text-sm leading-5 text-slate-300 transition hover:border-cyan-300/25 hover:text-cyan-100">
                    {item}
                  </button>
                ))}
              </div>
            </Card>

            <Card>
              <CardTitle>Copilot Context</CardTitle>
              <div className="mt-4 grid gap-3">
                {capabilities.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.title} className="flex gap-3 rounded-md border border-cyan-300/10 bg-slate-950/45 p-3">
                      <span className="rounded-md border border-[#D6A85F]/25 bg-[#D6A85F]/10 p-2 text-[#F8E0AD]">
                        <Icon size={16} />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-2 text-[#D6A85F]">
                <Sparkles size={17} />
                <CardTitle>Integration Status</CardTitle>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Ask AI is connected to the CTRL SEA n8n AI workflow. If the AI workflow is unavailable, core port, risk, chokepoint, spillover, and executive-summary questions fall back to warehouse APIs.
              </p>
              <div className="mt-4 flex items-center gap-2 rounded-md border border-emerald-300/15 bg-emerald-400/5 px-3 py-2 text-xs text-emerald-200">
                <TrendingUp size={14} /> AI workflow connected
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
