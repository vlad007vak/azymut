import { FileSearchIcon } from "lucide-react";
import type { Metadata } from "next";

import { NaglowekStrony } from "@/components/naglowek-strony";

import { PodgladOsp } from "./podglad-osp";

export const metadata: Metadata = {
  title: "Analiza opisu stanowiska",
  description: "Sugerowany arkusz oceny, kryteria dodatkowe i wskaźniki na podstawie opisu stanowiska pracy.",
};

export default function OspPage() {
  return (
    <>
      <NaglowekStrony
        ikona={FileSearchIcon}
        nadtytul="Ocena okresowa · opis stanowiska pracy"
        tytul="Analiza opisu stanowiska pracy"
        opis="Pierwszy krok oceny okresowej: na podstawie OSP podpowiemy arkusz oceny, do trzech kryteriów dodatkowych i wskaźniki najważniejsze dla zadań na stanowisku. Każdą sugestię możesz przyjąć albo odrzucić."
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <PodgladOsp />
      </div>
    </>
  );
}
