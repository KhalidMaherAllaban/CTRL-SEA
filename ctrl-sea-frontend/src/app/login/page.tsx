"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Github, Loader2, LockKeyhole, Mail } from "lucide-react";
import { CtrlSeaLogo } from "@/components/branding/ctrl-sea-logo";
import { MapLoader } from "@/components/login-globe/MapLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError, getSocialAuthUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const trust = ["Enterprise Security", "Role-Based Access Control", "Secure Authentication", "Encrypted Sessions", "GDPR Ready"];
const appRoutes = new Set([
  "/admin",
  "/ai",
  "/analytics",
  "/chokepoints",
  "/climate-risk",
  "/countries",
  "/dashboard",
  "/disruptions",
  "/map",
  "/ports",
  "/reports",
  "/risk-center",
  "/spillover",
  "/trade-risk"
]);
const googleAuthErrors: Record<string, string> = {
  disabled: "This account is disabled. Contact your CTRL SEA administrator.",
  google_denied: "Google sign-in was cancelled.",
  google_failed: "Google sign-in failed. Please try again.",
  google_not_configured: "Google sign-in is not configured yet. Add the Google OAuth client ID and secret on the backend."
};

type Provider = "google" | "microsoft" | "github";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<Provider | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const authError = searchParams.get("auth_error");
  const displayedError = error || (authError ? googleAuthErrors[authError] ?? "Authentication failed. Please try again." : "");

  function nextPath() {
    const next = searchParams.get("next");
    return next && appRoutes.has(next) ? next : "/dashboard";
  }

  function startGoogleLogin() {
    setError("");
    setSocialLoading("google");
    window.location.assign(getSocialAuthUrl("google", nextPath()));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();

    if (!email.includes("@")) {
      setError("Enter a valid business email address.");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    try {
      if (mode === "register") {
        if (name.length < 2) throw new Error("Enter your full name.");
        await register(name, email, password);
      } else {
        await login(email, password, remember);
      }
      router.push(nextPath() as Route);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else if (err instanceof Error) setError(err.message);
      else setError("Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#03152D] text-slate-100">
      <div className="pointer-events-none fixed inset-0 maritime-grid opacity-40" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(48,213,255,.18),transparent_30%),radial-gradient(circle_at_76%_18%,rgba(214,168,95,.13),transparent_25%),linear-gradient(135deg,#03152D_0%,#020617_62%,#082D56_120%)]" />

      <section className="relative z-10 grid min-h-screen lg:grid-cols-[1.08fr_.92fr]">
        <aside className="relative hidden min-h-screen min-w-0 overflow-hidden border-cyan-300/10 bg-[#020617] lg:block lg:border-r">
          <MapLoader />
          <div className="pointer-events-none absolute inset-0 maritime-grid opacity-20" />
          <div className="relative z-10 flex min-h-screen flex-col justify-between p-8 xl:p-12">
            <Link href="/" className="inline-flex">
              <CtrlSeaLogo variant="responsive" />
            </Link>

            <div className="mt-12 max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#D6A85F]">Maritime Intelligence Platform</p>
              <h1 className="mt-4 text-5xl font-black leading-[1.02] text-white sm:text-6xl xl:text-7xl">CTRL SEA</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-cyan-50/78 sm:text-xl">
                Enter a global maritime command layer powered by Esri ArcGIS, warehouse intelligence, and risk analytics.
              </p>
            </div>

            <div className="rounded-md border border-cyan-300/15 bg-slate-950/55 p-4 text-sm text-cyan-100 shadow-[0_0_80px_rgba(48,213,255,.15)] backdrop-blur-xl">
              Live maritime visualization powered by Esri ArcGIS and CTRL SEA PortWatch warehouse data.
            </div>
          </div>
        </aside>

        <section className="relative flex min-w-0 items-center justify-center px-6 py-10 sm:px-8 xl:px-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(48,213,255,.12),transparent_34%)] lg:hidden" />
          <div className="w-full min-w-0 max-w-xl">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#D6A85F]">Secure access</p>
                <h2 className="mt-2 text-3xl font-bold text-white">Welcome Back</h2>
                <p className="mt-2 text-sm text-slate-400">Sign in to access maritime intelligence.</p>
              </div>
              <Image src="/ctrl-sea-wave.svg" alt="" width={62} height={62} className="hidden rounded-2xl drop-shadow-[0_0_22px_rgba(214,168,95,.32)] sm:block" />
            </div>

            <div className="rounded-lg border border-cyan-300/15 bg-slate-950/55 p-5 shadow-[0_24px_90px_rgba(0,0,0,.44)] backdrop-blur-2xl sm:p-7">
              <div className="grid gap-3">
                <SocialButton provider="google" loading={socialLoading === "google"} onClick={startGoogleLogin} />
                <SocialButton provider="microsoft" />
                <SocialButton provider="github" />
              </div>

              <div className="my-7 flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                <span className="h-px flex-1 bg-cyan-300/12" />
                OR
                <span className="h-px flex-1 bg-cyan-300/12" />
              </div>

              <form onSubmit={submit} className="space-y-4">
                {mode === "register" && (
                  <label className="block">
                    <span className="mb-2 block text-xs font-medium text-slate-300">Full Name</span>
                    <Input name="name" autoComplete="name" placeholder="Khalid Maher" required />
                  </label>
                )}

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-300">Email Address</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200/55" />
                    <Input name="email" type="email" autoComplete="email" placeholder="analyst@ctrl-sea.com" required className="pl-10" />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium text-slate-300">Password</span>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200/55" />
                    <Input name="password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="Minimum 8 characters" minLength={8} required className="pl-10 pr-11" />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded text-slate-400 transition hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300" aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <label className="inline-flex items-center gap-2 text-slate-300">
                    <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="h-4 w-4 rounded border-cyan-300/25 bg-slate-950 accent-[#30D5FF]" />
                    Remember Me
                  </label>
                  <span className="cursor-not-allowed text-slate-500" title="Password recovery is not configured">Password Recovery Coming Soon</span>
                </div>

                {displayedError && (
                  <p role="alert" className="rounded-md border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                    {displayedError}
                  </p>
                )}

                <Button disabled={loading} className="h-12 w-full border-[#30D5FF]/40 bg-[#30D5FF]/18 text-base font-semibold text-cyan-50 hover:bg-[#30D5FF]/28">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight size={18} />}
                  {mode === "login" ? "Sign In" : "Create Account"}
                </Button>
              </form>

              <button onClick={() => setMode(mode === "login" ? "register" : "login")} className="mt-5 w-full text-center text-sm text-cyan-200 transition hover:text-cyan-100">
                {mode === "login" ? "Create Account" : "Already registered? Sign In"}
              </button>
            </div>

            <div className="mt-6 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
              {trust.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-md border border-cyan-300/10 bg-slate-950/40 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-[#00E5A0]" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function SocialButton({ provider, loading = false, onClick }: { provider: Provider; loading?: boolean; onClick?: () => void }) {
  const labels = {
    google: "Google",
    microsoft: "Microsoft",
    github: "GitHub"
  };
  const enabled = Boolean(onClick);

  return (
    <button
      type="button"
      disabled={!enabled || loading}
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition ${
        enabled
          ? "border-cyan-300/25 bg-slate-50 text-slate-950 hover:bg-cyan-50 disabled:cursor-wait disabled:opacity-75"
          : "border-cyan-300/15 bg-slate-900/70 text-slate-400 opacity-70"
      }`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ProviderIcon provider={provider} />}
      <span>{enabled ? `Continue with ${labels[provider]}` : `${labels[provider]} Coming Soon`}</span>
    </button>
  );
}

function ProviderIcon({ provider }: { provider: Provider }) {
  if (provider === "github") return <Github className="h-4 w-4" />;
  if (provider === "microsoft") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
        <path fill="#F25022" d="M3 3h8.4v8.4H3z" />
        <path fill="#7FBA00" d="M12.6 3H21v8.4h-8.4z" />
        <path fill="#00A4EF" d="M3 12.6h8.4V21H3z" />
        <path fill="#FFB900" d="M12.6 12.6H21V21h-8.4z" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M21.6 12.23c0-.74-.07-1.45-.19-2.13H12v4.03h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.25c1.9-1.75 2.97-4.33 2.97-7.43Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.25-2.51c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.05v2.59A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.9a6 6 0 0 1 0-3.8V7.51H3.05a10 10 0 0 0 0 8.98l3.36-2.59Z" />
      <path fill="#EA4335" d="M12 5.98c1.47 0 2.8.51 3.84 1.5l2.87-2.87A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.95 5.51l3.36 2.59C7.2 7.74 9.4 5.98 12 5.98Z" />
    </svg>
  );
}
