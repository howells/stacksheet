import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./global.css";

const siteUrl = "https://stacksheet.danielhowells.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Stacksheet — Typed sheet stacking for React",
    template: "%s — Stacksheet",
  },
  description:
    "A typed, animated sheet stack for React. Open, push, and navigate sheets from anywhere with Zustand and Motion.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Stacksheet",
    title: "Stacksheet — Typed sheet stacking for React",
    description:
      "A typed, animated sheet stack for React. Open, push, and navigate sheets from anywhere with Zustand and Motion.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stacksheet — Typed sheet stacking for React",
    description:
      "A typed, animated sheet stack for React. Open, push, and navigate sheets from anywhere with Zustand and Motion.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://rsms.me/" rel="preconnect" />
        <link href="https://rsms.me/inter/inter.css" rel="stylesheet" />
      </head>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
