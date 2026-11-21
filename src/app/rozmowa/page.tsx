import type { Metadata } from "next";

import { WyborOcenyRozmowy } from "@/features/rozmowa";

export const metadata: Metadata = {
  title: "Asystent rozmowy",
  description: "Wybierz ocenę, dla której chcesz przygotować rozmowę oceniającą.",
};

export default function RozmowaListaPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Asystent rozmowy</h1>
        <p className="max-w-3xl text-muted-foreground">
          Wybierz ocenę, dla której chcesz przygotować rozmowę oceniającą.
        </p>
      </div>
      <WyborOcenyRozmowy />
    </div>
  );
}
