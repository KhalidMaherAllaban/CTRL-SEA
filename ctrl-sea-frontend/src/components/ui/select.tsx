import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn("h-10 w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20", className)}
      {...props}
    />
  );
}

