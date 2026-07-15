"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CtrlSeaLogo } from "@/components/branding/ctrl-sea-logo";
import { Button } from "@/components/ui/button";
import { endpoints } from "@/lib/api";

type BackendState = "checking" | "online" | "offline";

export function BackendStatusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BackendState>("checking");
  const [checking, setChecking] = useState(false);

  const checkBackend = useCallback(async () => {
    setChecking(true);
    try {
      const health = await endpoints.health();
      setState(health.status === "healthy" ? "online" : "offline");
    } catch {
      setState("offline");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void checkBackend();
  }, [checkBackend]);

  useEffect(() => {
    if (state !== "offline") return;
    const interval = window.setInterval(() => void checkBackend(), 10_000);
    return () => window.clearInterval(interval);
  }, [checkBackend, state]);

  if (state === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-radial-ocean text-cyan-100">
        <div className="text-center">
          <CtrlSeaLogo variant="icon" className="ctrl-sea-loader justify-center" />
          <p className="mt-4 text-xs uppercase tracking-[0.24em]">Connecting to CTRL SEA</p>
        </div>
      </div>
    );
  }

  if (state === "offline") {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-radial-ocean p-6 text-white">
        <div className="maritime-grid absolute inset-0 opacity-40" />
        <section className="relative z-10 w-full max-w-lg rounded-2xl border border-cyan-300/15 bg-slate-950/75 p-8 text-center shadow-2xl backdrop-blur-xl">
          <CtrlSeaLogo variant="full" className="mb-8 flex-col justify-center gap-3" />
          <WifiOff className="mx-auto mb-4 text-amber-300" size={42} aria-hidden="true" />
          <h1 className="text-2xl font-semibold">Backend Offline</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            CTRL SEA cannot reach its local API or SQL Server yet. Your browser is safe—startup may still be retrying in the background.
          </p>
          <Button className="mx-auto mt-6" onClick={() => void checkBackend()} disabled={checking}>
            <RefreshCw size={16} className={checking ? "animate-spin" : ""} />
            {checking ? "Checking…" : "Try again"}
          </Button>
          <p className="mt-5 text-xs text-slate-500">Automatic reconnection runs every 10 seconds.</p>
        </section>
      </main>
    );
  }

  return children;
}
