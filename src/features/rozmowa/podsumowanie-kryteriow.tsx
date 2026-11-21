import { Badge } from "@/components/ui/badge";
import { nazwaPoziomu } from "@/lib/ocena/model";
import type { RodzajOceny } from "@/types/ocena";

import { etykietaPoziomu, type KryteriumPodsumowanie, type WskaznikPodsumowanie } from "./podsumowanie";

function Wskaznik({ w }: { w: WskaznikPodsumowanie }) {
  return (
    <li className="border-l-2 border-border pl-3">
      <p className="font-medium">{w.opis}</p>
      {w.poziom === undefined && <p className="text-muted-foreground">Wskaźnik jeszcze nieoceniony.</p>}
      {w.poziom === null && (
        <p className="text-muted-foreground">
          <Badge variant="outline">Brak podstaw do oceny</Badge> – nie było okazji zaobserwować zachowania.
        </p>
      )}
      {w.poziom !== undefined && w.poziom !== null && (
        <p>
          <span className="text-muted-foreground">Wybrane zachowanie ({nazwaPoziomu(w.poziom).toLowerCase()}): </span>
          {w.zachowanie}
        </p>
      )}
      {w.przyklad ? (
        <p className="mt-1 text-muted-foreground">
          <span className="font-medium text-foreground">Przykład:</span> {w.przyklad}
        </p>
      ) : (
        w.poziom !== undefined && (
          <p className="mt-1 text-amber-700 dark:text-amber-400">Brak zapisanego przykładu.</p>
        )
      )}
    </li>
  );
}

function Kryterium({ k, rodzaj }: { k: KryteriumPodsumowanie; rodzaj: RodzajOceny }) {
  return (
    <section aria-labelledby={`kryt-${k.kompetencjaId}`} className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 id={`kryt-${k.kompetencjaId}`} className="font-semibold">
          {k.nazwa}
        </h3>
        {rodzaj === "okresowa" && (
          <Badge variant="outline">{k.dodatkowe ? "kryterium dodatkowe" : "kryterium obowiązkowe"}</Badge>
        )}
      </div>
      <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Sugerowany poziom (podpowiedź systemu)</dt>
          <dd className="font-medium">
            {k.sugerowany ? etykietaPoziomu(k.sugerowany) : "Brak podstaw do oceny"}
            {k.sugestia.srednia !== null && (
              <span className="font-normal text-muted-foreground">
                {" "}
                · średnia {k.sugestia.srednia.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} pkt z{" "}
                {k.sugestia.ocenione} wsk.
                {k.sugestia.brakPodstaw > 0 && `, ${k.sugestia.brakPodstaw} bez podstaw`}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Decyzja przełożonego</dt>
          <dd className="font-medium">{k.decyzja ? etykietaPoziomu(k.decyzja) : "Jeszcze nie wybrano"}</dd>
        </div>
      </dl>
      {k.wskazniki.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-3 text-sm">
          {k.wskazniki.map((w) => (
            <Wskaznik key={w.id} w={w} />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Nie wybrano wskaźników dla tego kryterium.</p>
      )}
    </section>
  );
}

export function PodsumowanieKryteriow({
  kryteria,
  rodzaj,
}: {
  kryteria: KryteriumPodsumowanie[];
  rodzaj: RodzajOceny;
}) {
  if (kryteria.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ta ocena nie ma jeszcze kryteriów z obserwacjami. Uzupełnij je w kreatorze oceny, a potem wróć tutaj,
        żeby przygotować rozmowę.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {rodzaj === "pierwsza" && (
        <p className="text-sm text-muted-foreground">
          Pierwsza ocena: skala 3 / 5 / 7 pkt (poniżej / na poziomie / powyżej oczekiwań).
        </p>
      )}
      {kryteria.map((k) => (
        <Kryterium key={k.kompetencjaId} k={k} rodzaj={rodzaj} />
      ))}
    </div>
  );
}
