import { CompassIcon } from "lucide-react";
import Link from "next/link";

import { NaglowekStrony } from "@/components/naglowek-strony";
import { buttonVariants } from "@/components/ui/button";

/** Strona 404 dla nieznanych adresów (po polsku, w motywie aplikacji). */
export default function NieZnaleziono() {
  return (
    <>
      <title>Nie znaleziono strony · Azymut</title>
      <NaglowekStrony
        ikona={CompassIcon}
        nadtytul="Błąd 404"
        tytul="Nie znaleziono strony"
        opis="Pod tym adresem nie ma strony. Sprawdź adres albo wróć do listy ocen."
      />
      <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-4 py-10">
        <Link href="/" className={buttonVariants({ variant: "brand", size: "lg" })}>
          Wróć do listy ocen
        </Link>
        <Link href="/asystent" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Asystent formalny
        </Link>
        <Link href="/hr" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Panel HR
        </Link>
      </div>
    </>
  );
}
