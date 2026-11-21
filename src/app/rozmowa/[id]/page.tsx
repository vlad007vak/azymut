import { ArrowLeftIcon, MessagesSquareIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { NaglowekStrony } from "@/components/naglowek-strony";
import { AsystentRozmowy, LadowanieRozmowy } from "@/features/rozmowa";

export const metadata: Metadata = {
  title: "Asystent rozmowy",
  description: "Przygotowanie do rozmowy oceniającej: lista kontrolna z rozporządzenia, pytania i argumenty.",
};

const TYTUL = "Asystent rozmowy";
const OPIS =
  "Przygotuj się do rozmowy oceniającej: sprawdź kryteria i przykłady, przejdź przez listę kontrolną z rozporządzenia i wybierz pytania oraz argumenty, które wykorzystasz.";

export default function RozmowaPage({ params }: PageProps<"/rozmowa/[id]">) {
  return (
    <>
      <NaglowekStrony
        ikona={MessagesSquareIcon}
        nadtytul="Rozmowa oceniająca"
        tytul={TYTUL}
        opis={OPIS}
        powrot={
          <Link
            href="/rozmowa"
            className="flex w-fit items-center gap-1 rounded-sm text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ArrowLeftIcon className="size-4" aria-hidden /> Wszystkie oceny
          </Link>
        }
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        {/* Nagłówek strony nie drukuje się – na wydruku zostaje dotychczasowy tytuł i opis. */}
        <div className="hidden flex-col gap-2 print:flex" aria-hidden>
          <p className="text-2xl font-semibold tracking-tight">{TYTUL}</p>
          <p className="text-muted-foreground">{OPIS}</p>
        </div>
        <Suspense fallback={<LadowanieRozmowy />}>
          {params.then(({ id }) => (
            <AsystentRozmowy ocenaId={id} />
          ))}
        </Suspense>
      </div>
    </>
  );
}
