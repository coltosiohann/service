import localFont from "next/font/local";

import { Providers } from "@/components/providers";

import type { Metadata } from "next";


import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FleetCare",
    template: "%s | FleetCare",
  },
  description: "Platforma completa pentru gestionarea flotei ETi a service-ului.",
  metadataBase: new URL("https://fleetcare.example.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} bg-background font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
