import { FileTextIcon, ListChecksIcon } from "lucide-react";
import type { Metadata } from "next";

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

export default function AsystentPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Asystent formalny</h1>
        <p className="max-w-3xl text-muted-foreground">
          Pytaj o terminy, kryteria, skalę ocen, rozmowy i dokumenty w pierwszej ocenie i ocenie okresowej.
          Asystent odpowiada na podstawie przepisów, poradników KPRM i bazy pytań i odpowiedzi urzędu oraz pokazuje,
          skąd pochodzi odpowiedź.
        </p>
      </header>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Zadaj pytanie</CardTitle>
            <CardDescription>
              Odpowiedzi generuje model językowy na podstawie wskazanych źródeł – mogą zawierać błędy, dlatego
              zawsze sprawdź cytat.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AsystentPanel className="min-h-[24rem]" />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileTextIcon className="size-4 text-primary" aria-hidden />
                Baza wiedzy
              </CardTitle>
              <CardDescription>
                {odmiana(FRAGMENTY.length, ["fragment", "fragmenty", "fragmentów"])} z dokumentów i{" "}
                {odmiana(FRAGMENTY_QA.length, ["pozycja", "pozycje", "pozycji"])} bazy pytań i odpowiedzi:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex list-disc flex-col gap-1.5 pl-4 text-sm">
                {DOKUMENTY_BAZY.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecksIcon className="size-4 text-primary" aria-hidden />
                Jak działa asystent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex list-decimal flex-col gap-1.5 pl-4 text-sm text-muted-foreground">
                {JAK_DZIALA.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
