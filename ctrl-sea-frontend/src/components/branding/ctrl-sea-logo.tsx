import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoVariant = "full" | "compact" | "icon" | "responsive";

const imageSizes = {
  full: { width: 92, height: 92 },
  compact: { width: 54, height: 54 },
  icon: { width: 44, height: 44 }
};

function LogoMark({ variant, className }: { variant: Exclude<LogoVariant, "responsive">; className?: string }) {
  const size = imageSizes[variant];
  return (
    <span className={cn("ctrl-sea-brand-mark", `ctrl-sea-brand-mark-${variant}`, className)}>
      <Image
        src={variant === "icon" ? "/ctrl-sea-wave.svg" : "/ctrl-sea-logo.png"}
        alt="CTRL SEA logo"
        width={size.width}
        height={size.height}
        priority={variant === "full"}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

function LogoText({ compact = false }: { compact?: boolean }) {
  return (
    <span className="min-w-0">
      <span className={cn("block font-extrabold tracking-[0.18em] text-white", compact ? "text-sm" : "text-xl")}>CTRL SEA</span>
      {!compact && (
        <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.26em] text-[#D6A85F]">
          Maritime Data Analytics
        </span>
      )}
    </span>
  );
}

export function CtrlSeaLogo({ variant = "responsive", className }: { variant?: LogoVariant; className?: string }) {
  if (variant === "icon") {
    return (
      <span className={cn("ctrl-sea-brand inline-flex items-center", className)} aria-label="CTRL SEA">
        <LogoMark variant="icon" />
      </span>
    );
  }

  if (variant === "compact") {
    return (
      <span className={cn("ctrl-sea-brand inline-flex items-center gap-3", className)} aria-label="CTRL SEA">
        <LogoMark variant="compact" />
        <LogoText compact />
      </span>
    );
  }

  if (variant === "full") {
    return (
      <span className={cn("ctrl-sea-brand inline-flex items-center gap-4", className)} aria-label="CTRL SEA Maritime Data Analytics">
        <LogoMark variant="full" />
        <LogoText />
      </span>
    );
  }

  return (
    <span className={cn("ctrl-sea-brand inline-flex items-center", className)} aria-label="CTRL SEA">
      <span className="sm:hidden">
        <LogoMark variant="icon" />
      </span>
      <span className="hidden sm:inline-flex lg:hidden">
        <CtrlSeaLogo variant="compact" />
      </span>
      <span className="hidden lg:inline-flex">
        <CtrlSeaLogo variant="full" />
      </span>
    </span>
  );
}
