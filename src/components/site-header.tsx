import Link from "next/link";
import { Suspense } from "react";

import { Logo } from "@/components/logo";
import { MobileNav, type NavItem } from "@/components/mobile-nav";
import { LinkiNawigacji, NawigacjaGlowna } from "@/components/nawigacja-glowna";
import { RolaWNaglowku } from "@/features/role";

// Te same pozycje trafiają do menu na węższym ekranie (MobileNav) – dodajesz w jednym miejscu.
const NAV: NavItem[] = [
  { href: "/", label: "Oceny" },
  { href: "/asystent", label: "Asystent formalny" },
  { href: "/rozmowa", label: "Asystent rozmowy" },
  { href: "/hr", label: "Panel HR" },
];

/** Granatowy nagłówek (klasa `dark` = granatowa powierzchnia z globals.css). */
export function SiteHeader() {
  return (
    <header className="dark sticky top-0 z-40 bg-background text-foreground shadow-sm print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          aria-label="Azymut – strona startowa"
          className="flex min-w-0 items-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Logo />
        </Link>
        <Suspense fallback={<LinkiNawigacji items={NAV} sciezka={null} />}>
          <NawigacjaGlowna items={NAV} />
        </Suspense>
        <div className="flex items-center gap-2">
          <RolaWNaglowku />
          <MobileNav items={NAV} />
        </div>
      </div>
      {/* Czerwony akcent pod logo */}
      <div aria-hidden className="h-0.5 bg-gradient-to-r from-brand via-brand/50 to-transparent sm:w-1/3" />
    </header>
  );
}
