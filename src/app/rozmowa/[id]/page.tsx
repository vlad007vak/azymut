import { ArrowLeftIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AsystentRozmowy, LadowanieRozmowy } from "@/features/rozmowa";

export const metadata: Metadata = {
  title: "Asystent rozmowy",
  description: "Przygotowanie do rozmowy oceniającej: lista kontrolna z rozporządzenia, pytania i argumenty.",
};

export default function RozmowaPage({ params }: PageProps<"/rozmowa/[id]">) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <Link
          href="/rozmowa"
          className="flex items-center gap-1 self-start text-sm text-muted-foreground hover:text-foreground print:hidden"
        >
          <ArrowLeftIcon className="size-4" aria-hidden /> Wszystkie oceny
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Asystent rozmowy</h1>
        <p className="max-w-3xl text-muted-foreground">
          Przygotuj się do rozmowy oceniającej: sprawdź kryteria i przykłady, przejdź przez listę kontrolną
          z rozporządzenia i wybierz pytania oraz argumenty, które wykorzystasz.
        </p>
      </div>
      <Suspense fallback={<LadowanieRozmowy />}>
        {params.then(({ id }) => (
          <AsystentRozmowy ocenaId={id} />
        ))}
      </Suspense>
    </div>
  );
}
