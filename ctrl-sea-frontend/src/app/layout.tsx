import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "CTRL SEA | Maritime Intelligence Platform",
    template: "CTRL SEA | %s"
  },
  description: "Enterprise maritime intelligence, climate risk, and supply chain analytics platform.",
  manifest: "/manifest.webmanifest",
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "icon", type: "image/svg+xml", url: "/favicon.svg" },
    { rel: "icon", type: "image/png", sizes: "32x32", url: "/favicon-32x32.png" },
    { rel: "apple-touch-icon", sizes: "180x180", url: "/apple-touch-icon.png" }
  ],
  openGraph: {
    title: "CTRL SEA | Maritime Intelligence Platform",
    description: "PortWatch-compatible maritime trade, risk, vessel, and port intelligence.",
    siteName: "CTRL SEA",
    images: [
      {
        url: "/ctrl-sea-og.png",
        width: 1200,
        height: 630,
        alt: "CTRL SEA Maritime Intelligence Platform"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "CTRL SEA | Maritime Intelligence Platform",
    description: "Enterprise maritime trade, risk, port, and vessel intelligence.",
    images: ["/ctrl-sea-og.png"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
