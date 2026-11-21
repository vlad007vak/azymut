import { MonitorIcon } from "lucide-react";

/**
 * Informacja na małych ekranach (< 768 px): aplikacja jest przeznaczona na komputer.
 * Zgodnie z odpowiedzią mentorki MC (21.11.2026): aplikacja webowa na komputer, blokada telefonu – opcjonalna.
 * Nie blokujemy dostępu, tylko informujemy. Bez JavaScriptu – widoczność steruje CSS (`md:hidden`).
 */
export function UwagaKomputer() {
  return (
    <div
      role="note"
      className="flex items-start gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-950 md:hidden print:hidden dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <MonitorIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        Azymut jest przeznaczony na komputer (ekran od 1024 px). Na telefonie część widoków może być nieczytelna.
      </p>
    </div>
  );
}
