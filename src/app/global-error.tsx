"use client";

import { useEffect } from "react";

import "./globals.css";

/**
 * Błąd w samym layoucie – zastępuje cały dokument, więc ma własne <html> i <body>
 * (bez nagłówka i czcionek z layoutu). Po polsku, w kolorach aplikacji.
 */
export default function BladGlobalny({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="pl">
      <body className="dark flex min-h-screen items-center justify-center bg-background p-6 font-sans text-foreground">
        <title>Wystąpił błąd · Azymut</title>
        <main className="flex max-w-lg flex-col gap-4">
          <p className="text-sm font-medium text-muted-foreground">Azymut · Kompas kompetencji</p>
          <h1 className="text-3xl font-bold">Coś poszło nie tak</h1>
          <p className="text-muted-foreground">
            Aplikacja napotkała nieoczekiwany błąd. Dane ocen są zapisane w tej przeglądarce – spróbuj ponownie.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => retry()}
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand/90"
            >
              Spróbuj ponownie
            </button>
            {/* Zwykły <a>: po błędzie layoutu pełne przeładowanie jest bezpieczniejsze niż nawigacja kliencka. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-muted">
              Strona startowa
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
