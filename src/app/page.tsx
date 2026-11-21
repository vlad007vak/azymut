import { CompassIcon } from "lucide-react";

import { APP_CONFIG } from "@/config/app";
import { KafelkiAsystentow, StartOcen } from "@/features/ocena";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10">
      <section className="flex flex-col items-start gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-primary">
          <CompassIcon className="size-4" aria-hidden /> Kompas kompetencji
        </p>
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">{APP_CONFIG.name}</h1>
        <p className="max-w-3xl text-lg text-muted-foreground">{APP_CONFIG.tagline}</p>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Oceniasz na podstawie konkretnych, obserwowalnych zachowań z modelu kompetencji (14 kompetencji, 49 wskaźników
          behawioralnych). System podpowiada poziom i pilnuje zasad z rozporządzeń – ostateczną decyzję zawsze podejmujesz Ty.
        </p>
      </section>
      <StartOcen />
      <KafelkiAsystentow />
    </div>
  );
}
