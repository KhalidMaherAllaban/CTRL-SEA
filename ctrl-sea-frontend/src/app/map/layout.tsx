import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maritime Map"
};

export default function MapLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
