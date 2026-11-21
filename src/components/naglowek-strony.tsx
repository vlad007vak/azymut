import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { TloLinie } from "@/components/dekoracje";
import { cn } from "@/lib/utils";

/**
 * Wspólny granatowy nagłówek podstrony (redesign 21.11). Użycie w `page.tsx`, PRZED kontenerem z treścią:
 *
 *   <NaglowekStrony ikona={BotIcon} nadtytul="Asystent formalny" tytul="..." opis="..." />
 *   <div className="mx-auto max-w-6xl px-4 py-8">…treść…</div>
 *
 * - `tytul` renderuje się jako jedyny <h1> strony – usuń dotychczasowy <h1>.
 * - `akcje` – przyciski po prawej (np. `buttonVariants({ variant: "brand" })` dla jednego głównego działania).
 * - `powrot` – link „wstecz” nad nadtytułem.
 * - `children` – dodatkowa treść pod opisem (np. plakietki).
 */
export function NaglowekStrony({
  tytul,
  nadtytul,
  opis,
  ikona: Ikona,
  akcje,
  powrot,
  children,
  className,
}: {
  tytul: ReactNode;
  nadtytul?: ReactNode;
  opis?: ReactNode;
  ikona?: LucideIcon;
  akcje?: ReactNode;
  powrot?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("dark relative overflow-hidden bg-background text-foreground print:hidden", className)}>
      <TloLinie />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-end md:justify-between">
        <div className="flex max-w-3xl flex-col gap-3">
          {powrot}
          {nadtytul && (
            <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              {Ikona && <Ikona className="size-4 text-brand" aria-hidden />}
              {nadtytul}
            </p>
          )}
          <h1 className="text-3xl font-bold sm:text-4xl">{tytul}</h1>
          {opis && <p className="text-base text-muted-foreground sm:text-lg">{opis}</p>}
          {children}
        </div>
        {akcje && <div className="flex shrink-0 flex-wrap items-center gap-2">{akcje}</div>}
      </div>
    </section>
  );
}
