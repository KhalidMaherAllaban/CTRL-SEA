import { CtrlSeaLogo } from "@/components/branding/ctrl-sea-logo";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-radial-ocean">
      <div className="text-center">
        <CtrlSeaLogo variant="icon" className="ctrl-sea-loader justify-center" />
        <p className="mt-4 text-xs uppercase tracking-[0.24em] text-cyan-100">Loading maritime intelligence</p>
      </div>
    </div>
  );
}
