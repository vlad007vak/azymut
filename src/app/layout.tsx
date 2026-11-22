import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UwagaKomputer } from "@/components/uwaga-komputer";
import { APP_CONFIG } from "@/config/app";

import "./globals.css";

// latin-ext = polskie znaki (ą, ę, ł, ś, ż...)
const fontSans = Geist({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
});

const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  // Pełne adresy dla podglądu linku (Open Graph) – obrazek z src/app/opengraph-image.png.
  metadataBase: new URL("https://azymut-bubylda.vercel.app"),
  title: {
    default: APP_CONFIG.name,
    template: `%s · ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: APP_CONFIG.name,
    title: `${APP_CONFIG.name} – ocena kompetencji krok po kroku`,
    description: APP_CONFIG.tagline,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      className={`${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          <a
            href="#tresc"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
          >
            Przejdź do treści
          </a>
          <UwagaKomputer />
          <SiteHeader />
          <main id="tresc" className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <Toaster richColors position="top-center" />
        </TooltipProvider>
      </body>
    </html>
  );
}
