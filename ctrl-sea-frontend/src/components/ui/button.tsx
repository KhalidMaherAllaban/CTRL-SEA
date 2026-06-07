import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-cyan-300/20 bg-cyan-400/10 px-4 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/20 hover:shadow-neon focus:outline-none focus:ring-2 focus:ring-cyan-300 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

