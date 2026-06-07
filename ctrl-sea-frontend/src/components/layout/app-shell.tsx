"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BarChart3, CloudLightning, Command, Database, Eye, FileText, Globe2, LayoutDashboard, Lock, Map, RadioTower, Search, Ship, ShieldAlert, TrendingUp, Users } from "lucide-react";
import { CtrlSeaLogo } from "@/components/branding/ctrl-sea-logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const nav: Array<{ href: Route; label: string; icon: typeof LayoutDashboard }> = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/map", label: "Maritime Map", icon: Map },
  { href: "/ports", label: "Ports", icon: Ship },
  { href: "/countries", label: "Countries", icon: Globe2 },
  { href: "/trade-flows", label: "Trade Flows", icon: TrendingUp },
  { href: "/chokepoints", label: "Chokepoints", icon: RadioTower },
  { href: "/risk-center", label: "Risk Center", icon: ShieldAlert },
  { href: "/climate-risk", label: "Climate Risk", icon: CloudLightning },
  { href: "/trade-risk", label: "Trade Risk", icon: BarChart3 },
  { href: "/spillover", label: "Spillover", icon: Globe2 },
  { href: "/disruptions", label: "Disruptions", icon: ShieldAlert },
  { href: "/reports", label: "Power BI", icon: FileText },
  { href: "/admin", label: "Admin", icon: Database }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isDemo, isReady, logout } = useAuth();

  useEffect(() => {
    if (isReady && !user && !isDemo) router.replace("/login");
    if (isReady && isDemo && pathname === "/admin") router.replace("/dashboard");
  }, [isDemo, isReady, pathname, router, user]);

  useEffect(() => {
    const titles: Record<string, string> = {
      "/dashboard": "CTRL SEA | Overview",
      "/map": "CTRL SEA | Maritime Map",
      "/ports": "CTRL SEA | Port Intelligence",
      "/countries": "CTRL SEA | Country Intelligence",
      "/trade-flows": "CTRL SEA | Global Trade Flows",
      "/risk-center": "CTRL SEA | Maritime Risk Center",
      "/chokepoints": "CTRL SEA | Chokepoint Intelligence",
      "/reports": "CTRL SEA | Analytics Center",
      "/admin": "CTRL SEA | Administration"
    };
    document.title = titles[pathname] ?? "CTRL SEA | Maritime Intelligence Platform";
  }, [pathname]);

  if (!isReady || (!user && !isDemo)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-radial-ocean text-cyan-200">
        <div className="text-center">
          <CtrlSeaLogo variant="icon" className="ctrl-sea-loader justify-center" />
          <p className="mt-4 text-xs uppercase tracking-[0.24em] text-cyan-100">Initializing CTRL SEA</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-radial-ocean">
      <div className="fixed inset-0 maritime-grid opacity-40" />
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-72 border-r border-cyan-300/10 bg-[#03152D]/80 p-5 backdrop-blur-xl lg:block">
        <Link href="/dashboard" className="flex justify-center">
          <CtrlSeaLogo variant="full" className="flex-col gap-3 text-center" />
        </Link>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => {
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
      <main className="relative z-10 lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-cyan-300/10 bg-slate-950/60 px-5 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/dashboard" className="lg:hidden">
              <CtrlSeaLogo variant="responsive" />
            </Link>
            <div className="hidden min-w-0 sm:block">
              <p className="text-xs uppercase tracking-[0.22em] text-[#D6A85F]">Enterprise command layer</p>
              <h1 className="truncate text-lg font-semibold text-white">CTRL SEA Maritime Intelligence Platform</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button title="Command palette Ctrl+K" className="hidden h-9 items-center gap-2 rounded-md border border-cyan-300/15 bg-slate-900/70 px-3 text-xs text-slate-300 transition hover:border-cyan-300/35 hover:text-cyan-100 md:flex">
              <Command size={14} /> Ctrl+K
            </button>
            <div className="hidden h-9 items-center gap-2 rounded-md border border-cyan-300/15 bg-slate-900/70 px-3 text-xs text-slate-400 xl:flex">
              <Search size={14} /> Search ports, vessels, countries
            </div>
            {isDemo && (
              <div className="hidden items-center gap-2 rounded-md border border-[#D6A85F]/30 bg-[#D6A85F]/10 px-3 py-2 text-xs font-medium text-[#D6A85F] md:flex">
                <Eye size={14} /> Demo read only
              </div>
            )}
            <div className="hidden items-center gap-2 rounded-md border border-cyan-300/15 bg-slate-900/70 px-3 py-2 text-xs text-slate-300 md:flex">
              <Users size={14} /> {user?.full_name ?? "Demo Analyst"}
            </div>
            <Button onClick={logout} className="h-9 px-3">
              <Lock size={15} /> Logout
            </Button>
          </div>
        </header>
        {isDemo && (
          <div className="border-b border-[#D6A85F]/25 bg-[#D6A85F]/10 px-5 py-2 text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#D6A85F]">
            Demo Mode - Read Only Access
          </div>
        )}
        <div className="p-5 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
