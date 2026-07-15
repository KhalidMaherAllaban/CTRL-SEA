import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass group/card rounded-xl p-5 transition duration-300 hover:border-cyan-300/25 hover:shadow-[0_24px_90px_rgba(0,0,0,.5),0_0_28px_rgba(48,213,255,.05)]", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-xs font-bold uppercase tracking-[0.2em] text-cyan-100/75", className)} {...props} />;
}
