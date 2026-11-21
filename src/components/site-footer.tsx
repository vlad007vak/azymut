import Link from "next/link";

import { Logo } from "@/components/logo";
import { APP_CONFIG } from "@/config/app";

const LINKI = [
  { href: "/", label: "Oceny" },
  { href: "/asystent", label: "Asystent formalny" },
  { href: "/rozmowa", label: "Asystent rozmowy" },
  { href: "/hr", label: "Panel HR" },
  { href: "/dokumentacja-api", label: "Dokumentacja API" },
];

export function SiteFooter() {
  return (
    <footer className="dark mt-12 bg-background text-foreground print:hidden">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-[1fr_auto]">
        <div className="grid content-start gap-3">
          <Logo />
          <p className="max-w-md text-sm text-muted-foreground">
            Prototyp przygotowany na HackNation {APP_CONFIG.year} · Zadanie: {APP_CONFIG.taskName}. Dane
            demonstracyjne są fikcyjne.
          </p>
        </div>
        <nav aria-label="Stopka" className="grid content-start gap-2 text-sm">
          {LINKI.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">
          © {APP_CONFIG.year} Zespół {APP_CONFIG.teamName}
        </p>
      </div>
    </footer>
  );
}
