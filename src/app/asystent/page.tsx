import { BookOpenTextIcon, FileTextIcon, ListChecksIcon, MessagesSquareIcon, type LucideIcon } from "lucide-react";
import type { Metadata } from "next";

import { NaglowekStrony } from "@/components/naglowek-strony";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AsystentPanel } from "@/features/asystent";
import { DOKUMENTY_BAZY, FRAGMENTY, FRAGMENTY_QA, odmiana } from "@/features/asystent/baza";

export const metadata: Metadata = {
  title: "Asystent formalny",
  description:
    "Zapytaj o zasady pierwszej oceny i oceny okresowej w służbie cywilnej. Odpowiedzi na podstawie ustawy o służbie cywilnej, rozporządzeń, poradników KPRM, modelu kompetencji i bazy pytań i odpowiedzi – zawsze ze źródłem.",
};

const JAK_DZIALA = [
  "Wyszukuje w bazie wiedzy fragmenty przepisów i poradników oraz pozycje bazy pytań i odpowiedzi pasujące do pytania.",
  "Model AI formułuje odpowiedź wyłącznie na podstawie tych fragmentów.",
  "Każde źródło ma dokument, miejsce (paragraf lub stronę) i dosłowny cytat.",
  "Gdy w bazie nie ma odpowiedzi – mówi to wprost zamiast zgadywać.",
  "Imiona i nazwiska są usuwane z pytania, zanim trafi ono do AI.",
];

/** Ikona sekcji w kafelku – jak na stronie startowej (lucide, cienka kreska). */
function IkonaSekcji({ ikona: Ikona }: { ikona: LucideIcon }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary" aria-hidden>
      <Ikona className="size-5" strokeWidth={1.5} />
    </span>
  );
}

export default function AsystentPage() {
  return (
    <>
      <NaglowekStrony
        ikona={BookOpenTextIcon}
        nadtytul="Służba cywilna · baza wiedzy"
        tytul="Asystent formalny"
        opis="Pytaj o terminy, kryteria, skalę ocen, rozmowy i dokumenty w pierwszej ocenie i ocenie okresowej. Asystent odpowiada na podstawie przepisów, poradników KPRM i bazy pytań i odpowiedzi urzędu oraz pokazuje, skąd pochodzi odpowiedź."
      />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex items-start gap-3">
              <IkonaSekcji ikona={MessagesSquareIcon} />
              <div className="grid gap-1">
                <CardTitle className="text-lg font-semibold">Zadaj pytanie</CardTitle>
                <CardDescription>
                  Odpowiedzi generuje model językowy na podstawie wskazanych źródeł – mogą zawierać błędy, dlatego
                  zawsze sprawdź cytat.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <AsystentPanel className="min-h-[24rem]" glownyPrzycisk />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="flex items-start gap-3">
                <IkonaSekcji ikona={FileTextIcon} />
                <div className="grid gap-1">
                  <CardTitle className="text-lg font-semibold">Baza wiedzy</CardTitle>
                  <CardDescription>
                    {odmiana(FRAGMENTY.length, ["fragment", "fragmenty", "fragmentów"])} z dokumentów i{" "}
                    {odmiana(FRAGMENTY_QA.length, ["pozycja", "pozycje", "pozycji"])} bazy pytań i odpowiedzi:
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col divide-y text-sm">
                  {DOKUMENTY_BAZY.map((d) => (
                    <li key={d} className="flex gap-2.5 py-2 first:pt-0 last:pb-0">
                      <FileTextIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex items-center gap-3">
                <IkonaSekcji ikona={ListChecksIcon} />
                <CardTitle className="text-lg font-semibold">Jak działa asystent</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
                  {JAK_DZIALA.map((t, i) => (
                    <li key={t} className="flex gap-3">
                      <span
                        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
                        aria-hidden
                      >
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{t}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
