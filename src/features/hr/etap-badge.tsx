import { Badge } from "@/components/ui/badge";
import { nazwaEtapu } from "@/lib/ocena/zasady";
import type { EtapOceny, Ocena } from "@/types/ocena";

import { opisTerminu, statusTerminu, type StatusTerminu } from "./terminy";

// Etapy w toku – odcienie granatu z motywu, coraz ciemniejsze z postępem; sporządzona (żółty) i zakończona (zielony) – kolory stanów.
const KOLOR_ETAPU: Record<EtapOceny, string> = {
  zaplanowana: "border-border bg-muted text-muted-foreground",
  kryteria: "border-primary/30 bg-card text-primary",
  obserwacje: "border-transparent bg-chart-3/30 text-primary",
  rozmowa: "border-transparent bg-primary text-primary-foreground",
  sporzadzona: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  zakonczona: "border-transparent bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
};

export function EtapBadge({ etap }: { etap: EtapOceny }) {
  return <Badge className={KOLOR_ETAPU[etap]}>{nazwaEtapu(etap)}</Badge>;
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
