"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { NavItem } from "@/components/mobile-nav";
import { cn } from "@/lib/utils";

/** Czy link prowadzi do bieżącej sekcji („Oceny” obejmuje też kreator /ocena/...). */
function aktywny(href: string, sciezka: string | null) {
  if (!sciezka) return false;
  if (href === "/") return sciezka === "/" || sciezka.startsWith("/ocena");
  return sciezka === href || sciezka.startsWith(`${href}/`);
}

/**
 * Linki w granatowym nagłówku (od 1024 px) – bieżąca sekcja podkreślona na czerwono.
 * `sciezka = null` → bez podkreślenia (fallback w <Suspense>, zanim znana jest ścieżka).
 */
export function LinkiNawigacji({ items, sciezka }: { items: NavItem[]; sciezka: string | null }) {
  return (
    <nav aria-label="Główna nawigacja" className="hidden h-full items-stretch gap-1 text-sm lg:flex">
      {items.map((item) => {
        const jest = aktywny(item.href, sciezka);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={jest ? "page" : undefined}
            className={cn(
              "relative flex items-center rounded-sm px-3 font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors",
              jest
                ? "text-foreground after:bg-brand"
                : "text-muted-foreground after:bg-transparent hover:text-foreground hover:after:bg-foreground/30",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Wersja z bieżącą ścieżką – w nagłówku owinięta w <Suspense> (cacheComponents, trasy z [id]). */
export function NawigacjaGlowna({ items }: { items: NavItem[] }) {
  const sciezka = usePathname();
  return <LinkiNawigacji items={items} sciezka={sciezka} />;
}
