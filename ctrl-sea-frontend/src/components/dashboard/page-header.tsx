import type { LucideIcon } from "lucide-react";

export function PageHeader({ eyebrow, title, description, icon: Icon, actions }: { eyebrow: string; title: string; description?: string; icon?: LucideIcon; actions?: React.ReactNode }) {
  return <header className="relative overflow-hidden rounded-xl border border-cyan-300/15 bg-gradient-to-r from-[#03152D]/95 via-[#082D56]/60 to-slate-950/85 p-5 shadow-[0_20px_70px_rgba(0,0,0,.36)] sm:p-6">
    <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_70%_50%,rgba(48,213,255,.14),transparent_58%)]" />
    <div className="relative flex flex-wrap items-center justify-between gap-5">
      <div className="flex min-w-0 items-start gap-4">
        {Icon && <span className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-200 shadow-[0_0_24px_rgba(48,213,255,.12)]"><Icon size={22} /></span>}
        <div><p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#D6A85F]">{eyebrow}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>{description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>}</div>
      </div>
      {actions && <div className="relative flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  </header>;
}

export function SectionHeader({ index, title, description }: { index: string; title: string; description?: string }) {
  return <div className="flex items-end justify-between gap-4 border-b border-cyan-300/10 pb-3"><div className="flex items-center gap-3"><span className="font-mono text-xs text-[#D6A85F]">{index}</span><div><h2 className="text-lg font-semibold text-white">{title}</h2>{description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}</div></div><span className="hidden h-px flex-1 bg-gradient-to-r from-cyan-300/15 to-transparent sm:block" /></div>;
}
