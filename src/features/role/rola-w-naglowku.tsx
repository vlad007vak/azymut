"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { IkonaRoli } from "./ikona-roli";
import { imieINazwisko } from "./role";
import { useRola } from "./use-rola";

/**
 * Do nagłówka: kim jestem (rola demonstracyjna) + „Zmień rolę”.
 * Bez wybranej roli – zachęta „Wybierz rolę” (strony oceny i tak działają).
 */
export function RolaWNaglowku({ className }: { className?: string }) {
  const { opis, gotowe } = useRola();

  // Cookie czytamy dopiero w przeglądarce – rezerwujemy miejsce, żeby nagłówek nie skakał.
  if (!gotowe) return <span aria-hidden className={cn("inline-block h-7 w-32", className)} />;

  if (!opis) {
    return (
      <Link
        href="/logowanie"
        className={cn(buttonVariants({ variant: "outline", size: "sm" }), className)}
        title="Prototyp – wybierz rolę demonstracyjną: przełożony albo HR"
      >
        <LogIn data-icon="inline-start" aria-hidden />
        Wybierz rolę
      </Link>
    );
  }

  const osoba = opis.osoba ? imieINazwisko(opis.osoba) : null;

  return (
    <div className={cn("flex min-w-0 items-center gap-1 text-sm", className)}>
      <span
        className="flex min-w-0 items-center gap-1.5 rounded-md bg-muted px-2 py-1"
        title={osoba ? `${opis.nazwa}: ${osoba}, ${opis.osoba?.stanowisko}` : opis.nazwa}
      >
        <IkonaRoli rola={opis.id} className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="sr-only">Twoja rola:</span>
        <span className="font-medium whitespace-nowrap">{opis.nazwaKrotka}</span>
        {osoba && <span className="hidden truncate text-muted-foreground xl:inline">· {osoba}</span>}
      </span>
      <Link href="/logowanie" className={buttonVariants({ variant: "ghost", size: "sm" })}>
        Zmień rolę
      </Link>
    </div>
  );
}
