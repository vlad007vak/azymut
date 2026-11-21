import type { Metadata } from "next";

import { PodgladOsp } from "./podglad-osp";

export const metadata: Metadata = {
  title: "Analiza opisu stanowiska",
  description: "Sugerowany arkusz oceny, kryteria dodatkowe i wskaźniki na podstawie opisu stanowiska pracy.",
};

export default function OspPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Analiza opisu stanowiska pracy</h1>
        <p className="max-w-3xl text-muted-foreground">
          Pierwszy krok oceny okresowej: na podstawie OSP podpowiemy arkusz oceny, do trzech kryteriów dodatkowych
          i wskaźniki najważniejsze dla zadań na stanowisku. Każdą sugestię możesz przyjąć albo odrzucić.
        </p>
      </div>
      <PodgladOsp />
    </div>
  );
}
