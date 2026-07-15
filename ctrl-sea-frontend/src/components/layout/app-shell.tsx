"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bot, Database, ExternalLink, FileText, Globe2, LayoutDashboard, Lock, Map, Menu, RadioTower, Search, Ship, ShieldAlert, Users, X } from "lucide-react";
import { CtrlSeaLogo } from "@/components/branding/ctrl-sea-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav: Array<{ href: Route; label: string; icon: typeof LayoutDashboard }> = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/map", label: "Maritime Map", icon: Map },
  { href: "/ports", label: "Ports", icon: Ship },
  { href: "/countries", label: "Countries", icon: Globe2 },
  { href: "/chokepoints", label: "Chokepoints", icon: RadioTower },
  { href: "/risk-center", label: "Risk Center", icon: ShieldAlert },
  { href: "/spillover", label: "Spillover", icon: Globe2 },
  { href: "/disruptions", label: "Disruptions", icon: ShieldAlert },
  { href: "/reports", label: "Power BI", icon: FileText },
  { href: "/ai", label: "Ask AI", icon: Bot },
  { href: "/admin", label: "Admin", icon: Database }
];

const pageTitles: Record<string, string> = {
  "/dashboard": "CTRL SEA | Overview",
  "/map": "CTRL SEA | Maritime Map",
  "/ports": "CTRL SEA | Port Intelligence",
  "/countries": "CTRL SEA | Country Intelligence",
  "/risk-center": "CTRL SEA | Maritime Risk Center",
  "/chokepoints": "CTRL SEA | Chokepoint Intelligence",
  "/climate-risk": "CTRL SEA | Climate Risk",
  "/trade-risk": "CTRL SEA | Trade Risk",
  "/spillover": "CTRL SEA | Spillover",
  "/disruptions": "CTRL SEA | Disruptions",
  "/reports": "CTRL SEA | Analytics Center",
  "/ai": "CTRL SEA | Ask AI",
  "/admin": "CTRL SEA | Administration"
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isReady, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isReady && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isReady, pathname, router, user]);

  useEffect(() => {
    if (isReady && user && pathname.startsWith("/admin") && user.role !== "admin") router.replace("/dashboard");
  }, [isReady, pathname, router, user]);

  useEffect(() => {
    document.title = pageTitles[pathname] ?? "CTRL SEA | Maritime Intelligence Platform";
  }, [pathname]);

  if (!isReady || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-radial-ocean text-cyan-200">
        <div className="text-center">
          <CtrlSeaLogo variant="icon" className="ctrl-sea-loader justify-center" />
          <p className="mt-4 text-xs uppercase tracking-[0.24em] text-cyan-100">Initializing CTRL SEA</p>
        </div>
      </div>
    );
  }

  const visibleNav = nav.filter((item) => item.href !== "/admin" || user.role === "admin");

  return (
    <div className="min-h-screen bg-radial-ocean">
      <div className="fixed inset-0 maritime-grid opacity-40" />
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-72 border-r border-cyan-300/10 bg-[#03152D]/80 p-5 backdrop-blur-xl lg:block">
        <Link href="/dashboard" className="flex justify-center">
          <CtrlSeaLogo variant="full" className="flex-col gap-3 text-center" />
        </Link>
        <nav className="mt-8 space-y-1">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-slate-300 transition hover:bg-cyan-300/10 hover:text-cyan-100", active && "bg-cyan-300/15 text-cyan-100 shadow-neon")}>
                <Icon size={18} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-lg lg:hidden" onClick={() => setMobileOpen(false)}>
          <nav onClick={(event) => event.stopPropagation()} className="h-full w-[min(88vw,340px)] overflow-y-auto border-r border-cyan-300/15 bg-[#03152D] p-5">
            <div className="flex items-center justify-between">
              <CtrlSeaLogo variant="responsive" />
              <button className="table-action" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
                <X size={17} />
              </button>
            </div>
            <div className="mt-8 space-y-1">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                return (
                  <Link onClick={() => setMobileOpen(false)} key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-400", pathname === item.href && "bg-cyan-300/15 text-cyan-100")}>
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}

      <main className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-cyan-300/10 bg-slate-950/60 px-5 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-4">
            <button className="table-action lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <Menu size={18} />
            </button>
            <Link href="/dashboard" className="hidden sm:block lg:hidden">
              <CtrlSeaLogo variant="responsive" />
            </Link>
            <div className="hidden min-w-0 sm:block">
              <p className="text-xs uppercase tracking-[0.22em] text-[#D6A85F]">Enterprise command layer</p>
              <h1 className="truncate text-lg font-semibold text-white">CTRL SEA Maritime Intelligence Platform</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              title="Open PortWatch dataset source"
              onClick={() => window.open("https://portwatch.imf.org/search?collection=dataset", "_blank", "noopener,noreferrer")}
              className="hidden h-9 items-center gap-2 rounded-md border border-cyan-300/15 bg-slate-900/70 px-3 text-xs text-slate-300 transition hover:border-cyan-300/35 hover:text-cyan-100 md:flex"
            >
              <ExternalLink size={14} /> DataSource
            </button>
            <div className="hidden h-9 items-center gap-2 rounded-md border border-emerald-300/15 bg-emerald-400/5 px-3 text-xs text-emerald-200 xl:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" /> Warehouse live
            </div>
            <div className="hidden h-9 items-center gap-2 rounded-md border border-cyan-300/15 bg-slate-900/70 px-3 text-xs text-slate-400 xl:flex">
              <Search size={14} /> Search ports, vessels, countries
            </div>
            <div className="hidden items-center gap-2 rounded-md border border-cyan-300/15 bg-slate-900/70 px-3 py-2 text-xs text-slate-300 md:flex">
              <Users size={14} /> {user.full_name}
            </div>
            <Button onClick={logout} className="h-9 px-3">
              <Lock size={15} /> Logout
            </Button>
          </div>
        </header>
        <div className="mx-auto max-w-[1800px] p-4 sm:p-5 lg:p-8">{children}</div>
        <button
          type="button"
          title="Ask AI"
          onClick={() => router.push("/ai")}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-fuchsia-300/25 bg-gradient-to-br from-fuchsia-600 to-pink-500 px-4 py-3 text-sm font-medium text-white shadow-xl shadow-fuchsia-950/30 transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-fuchsia-200"
          aria-label="Ask AI"
        >
          <Bot size={16} />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </main>
    </div>
  );
}
