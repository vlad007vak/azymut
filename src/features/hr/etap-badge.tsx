import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { nazwaEtapu } from "@/lib/ocena/zasady";
import type { EtapOceny, Ocena } from "@/types/ocena";

import { opisTerminu, statusTerminu, type StatusTerminu } from "./terminy";

const KOLOR_ETAPU: Record<EtapOceny, string> = {
  zaplanowana: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  kryteria: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-100",
  obserwacje: "bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-100",
  rozmowa: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-100",
  sporzadzona: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  zakonczona: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
};

export function EtapBadge({ etap }: { etap: EtapOceny }) {
  return <Badge className={cn("border-transparent", KOLOR_ETAPU[etap])}>{nazwaEtapu(etap)}</Badge>;
}

const KOLOR_TERMINU: Record<StatusTerminu, string> = {
  "po-terminie": "font-semibold text-destructive",
  "zbliza-sie": "font-semibold text-amber-700 dark:text-amber-400",
  "w-terminie": "text-foreground",
  zakonczona: "text-muted-foreground",
};

/** „Zostało X dni” / „Po terminie X dni” z wyróżnieniem pilnych terminów. */
export function OpisTerminu({ ocena, dzis }: { ocena: Ocena; dzis: string }) {
  const status = statusTerminu(ocena, dzis);
  return <span className={KOLOR_TERMINU[status]}>{opisTerminu(ocena, dzis)}</span>;
}
