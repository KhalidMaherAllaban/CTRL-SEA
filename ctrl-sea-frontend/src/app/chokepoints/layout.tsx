import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chokepoint Intelligence"
};

export default function ChokepointsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
