import { MessagesSquareIcon } from "lucide-react";
import type { Metadata } from "next";

import { NaglowekStrony } from "@/components/naglowek-strony";
import { WyborOcenyRozmowy } from "@/features/rozmowa";

export const metadata: Metadata = {
  title: "Asystent rozmowy",
  description: "Wybierz ocenę, dla której chcesz przygotować rozmowę oceniającą.",
};

export default function RozmowaListaPage() {
  return (
    <>
      <NaglowekStrony
        ikona={MessagesSquareIcon}
        nadtytul="Rozmowa oceniająca"
        tytul="Asystent rozmowy"
        opis="Wybierz ocenę, dla której chcesz przygotować rozmowę oceniającą."
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <WyborOcenyRozmowy />
      </div>
    </>
  );
}
