import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workout Logger PWA",
  description: "Offline-first workout logging, programming, analytics, import, export, and progression recommendations.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Workout Logger"
  }
};

export const viewport: Viewport = {
  themeColor: "#0f9f8a",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
