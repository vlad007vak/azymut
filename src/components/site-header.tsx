import Link from "next/link";

import { MobileNav, type NavItem } from "@/components/mobile-nav";
import { Badge } from "@/components/ui/badge";
import { APP_CONFIG } from "@/config/app";
import { RolaWNaglowku } from "@/features/role";

// Te same pozycje trafiają do menu na węższym ekranie (MobileNav) – dodajesz w jednym miejscu.
const NAV: NavItem[] = [
  { href: "/", label: "Oceny" },
  { href: "/asystent", label: "Asystent formalny" },
  { href: "/rozmowa", label: "Asystent rozmowy" },
  { href: "/hr", label: "Panel HR" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur print:hidden">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
          <span className="truncate">{APP_CONFIG.name}</span>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            HackNation {APP_CONFIG.year}
          </Badge>
        </Link>
        <nav aria-label="Główna nawigacja" className="hidden items-center gap-5 text-sm lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <RolaWNaglowku />
          <MobileNav items={NAV} />
        </div>
      </div>
    </header>
  );
}
