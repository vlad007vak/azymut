import type { Metadata } from "next";
import { Suspense } from "react";

import { KreatorOceny, LadowanieKreatora } from "@/features/ocena";

export const metadata: Metadata = {
  title: "Kreator oceny",
  description: "Ocena pracownika krok po kroku: kryteria, wskaźniki behawioralne, sugerowany poziom, decyzja i dokument.",
};

async function Kreator({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <KreatorOceny ocenaId={decodeURIComponent(id)} />;
}

export default function OcenaPage({ params }: PageProps<"/ocena/[id]">) {
  return (
    <Suspense fallback={<LadowanieKreatora />}>
      <Kreator params={params} />
    </Suspense>
  );
}
