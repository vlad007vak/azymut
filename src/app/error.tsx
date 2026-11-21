"use client";

import { TriangleAlertIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { NaglowekStrony } from "@/components/naglowek-strony";
import { Button, buttonVariants } from "@/components/ui/button";

/** Granica błędów stron (po polsku). Nagłówek i stopka z layoutu zostają widoczne. */
export default function BladStrony({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const kod =
    typeof error === "object" && error !== null && "digest" in error ? String((error as { digest?: string }).digest ?? "") : "";

  return (
    <>
      <title>Wystąpił błąd · Azymut</title>
      <NaglowekStrony
        ikona={TriangleAlertIcon}
        nadtytul="Błąd aplikacji"
        tytul="Coś poszło nie tak"
        opis="Nie udało się wyświetlić tej strony. Dane ocen są zapisane w tej przeglądarce – spróbuj ponownie albo wróć do listy ocen."
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10">
        <div className="flex flex-wrap gap-3">
          <Button variant="brand" size="lg" onClick={() => retry()}>
            Spróbuj ponownie
          </Button>
          <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Wróć do listy ocen
          </Link>
        </div>
        {kod && <p className="text-xs text-muted-foreground">Kod błędu: {kod}</p>}
      </div>
    </>
  );
}
