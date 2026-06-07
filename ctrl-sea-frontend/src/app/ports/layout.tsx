import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Port Intelligence"
};

export default function PortsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
