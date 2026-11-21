import {
  ArrowDownIcon,
  ArrowRightIcon,
  BookOpenTextIcon,
  ClipboardCheckIcon,
  LayoutDashboardIcon,
  MessagesSquareIcon,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { RozaWiatrow, TloLinie } from "@/components/dekoracje";
import { buttonVariants } from "@/components/ui/button";
import { StartOcen } from "@/features/ocena";
import { cn } from "@/lib/utils";

const KAFELKI: { href: string; tytul: string; opis: string; ikona: LucideIcon }[] = [
  {
    href: "#oceny",
    tytul: "Dwie ścieżki oceny",
    opis: "Pierwsza ocena (3/5/7 pkt) i ocena okresowa (arkusz B lub C, 1–9 pkt).",
    ikona: ClipboardCheckIcon,
  },
  {
    href: "/asystent",
    tytul: "Asystent formalny",
    opis: "Zasady oceny z przepisów i poradników KPRM – ze wskazaniem źródła.",
    ikona: BookOpenTextIcon,
  },
  {
    href: "/rozmowa",
    tytul: "Asystent rozmowy",
    opis: "Plan rozmowy oceniającej: pytania, kwestie do omówienia, argumenty, rozwój.",
    ikona: MessagesSquareIcon,
  },
  {
    href: "/hr",
    tytul: "Panel HR",
    opis: "Statusy procesów, terminy i przypomnienia dla oceniających.",
    ikona: LayoutDashboardIcon,
  },
];

export default function HomePage() {
  return (
    <>
      <section className="dark relative overflow-hidden bg-background text-foreground">
        <TloLinie />
        <RozaWiatrow className="absolute top-1/2 right-[-4rem] hidden size-[30rem] -translate-y-1/2 lg:block xl:right-0" />
        <div className="relative mx-auto max-w-6xl px-4">
          <div className="flex max-w-2xl flex-col items-start gap-6 py-16 lg:py-24">
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Służba cywilna · Kompas kompetencji
            </p>
            <h1 className="text-4xl leading-[1.05] font-bold sm:text-6xl">
              Ocena kompetencji
              <br />
              krok po kroku
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Pierwsza ocena i ocena okresowa zgodnie z rozporządzeniami – na podstawie obserwowalnych zachowań z modelu
              kompetencji. AI doradza, decyzję podejmuje przełożony.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#oceny" className={cn(buttonVariants({ variant: "brand", size: "lg" }), "h-11 px-5 text-base")}>
                Przejdź do ocen
                <ArrowDownIcon data-icon="inline-end" aria-hidden />
              </a>
              <Link href="/asystent" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-5 text-base")}>
                Zapytaj asystenta
              </Link>
            </div>
          </div>
        </div>
        <nav aria-label="Funkcje Azymutu" className="relative border-t">
          <ul className="mx-auto grid max-w-6xl md:grid-cols-2 lg:grid-cols-4">
            {KAFELKI.map(({ href, tytul, opis, ikona: Ikona }, i) => (
              <li key={href} className={cn("border-b lg:border-b-0", i > 0 && "lg:border-l", i % 2 === 1 && "md:border-l")}>
                <Link
                  href={href}
                  className="group flex h-full flex-col gap-2 px-4 py-6 outline-none transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset lg:px-6"
                >
                  <Ikona className="size-7 text-foreground/80" strokeWidth={1.5} aria-hidden />
                  <span className="flex items-center gap-1.5 font-semibold">
                    {tytul}
                    <ArrowRightIcon
                      className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                  <span className="text-sm text-muted-foreground">{opis}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <section id="oceny" aria-labelledby="oceny-tytul" className="mx-auto flex max-w-6xl scroll-mt-24 flex-col gap-6 px-4 py-12">
        <div className="flex max-w-3xl flex-col gap-2">
          <h2 id="oceny-tytul" className="text-2xl font-bold sm:text-3xl">
            Rozpocznij lub kontynuuj ocenę
          </h2>
          <p className="text-muted-foreground">
            Oceniasz na podstawie konkretnych, obserwowalnych zachowań z modelu kompetencji (14 kompetencji, 49 wskaźników
            behawioralnych). System podpowiada poziom i pilnuje zasad z rozporządzeń – ostateczną decyzję zawsze podejmujesz
            Ty.
          </p>
        </div>
        <StartOcen />
      </section>
    </>
  );
}
