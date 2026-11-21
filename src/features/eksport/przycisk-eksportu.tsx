"use client";

import { DownloadIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Ocena } from "@/types/ocena";

import { BladEksportu, eksportujOcene, nazwaPlikuEksportu, type OpcjeEksportu } from "./eksport";

const ETAPY_GOTOWE = new Set<Ocena["etap"]>(["sporzadzona", "zakonczona"]);

export interface PrzyciskEksportuProps {
  ocena: Ocena;
  /** Nazwa urzędu na arkuszu (domyślnie `APP_CONFIG.urzad`). */
  urzad?: OpcjeEksportu["urzad"];
  className?: string;
}

/** Przycisk „Pobierz JSON” – zapisuje ocenę w formacie wymiany `azymut.ocena` v1. */
export function PrzyciskEksportu({ ocena, urzad, className }: PrzyciskEksportuProps) {
  const pobierz = () => {
    let url: string | undefined;
    try {
      const dane = eksportujOcene(ocena, { urzad });
      const plik = new Blob([JSON.stringify(dane, null, 2)], { type: "application/json;charset=utf-8" });
      url = URL.createObjectURL(plik);
      const a = document.createElement("a");
      a.href = url;
      a.download = nazwaPlikuEksportu(dane);
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Pobrano plik JSON", {
        description: ETAPY_GOTOWE.has(ocena.etap)
          ? "Plik zawiera dane osobowe – przechowuj go zgodnie z zasadami urzędu."
          : "Ocena nie jest jeszcze sporządzona – plik zawiera wersję roboczą. Zawiera dane osobowe.",
      });
    } catch (err) {
      console.error("[eksport]", err);
      toast.error("Nie udało się wyeksportować oceny", {
        description: err instanceof BladEksportu ? err.message : "Spróbuj ponownie.",
      });
    } finally {
      // Zwolnienie adresu dopiero po rozpoczęciu pobierania.
      const doZwolnienia = url;
      if (doZwolnienia) setTimeout(() => URL.revokeObjectURL(doZwolnienia), 1000);
    }
  };

  return (
    <Button variant="outline" onClick={pobierz} className={className}>
      <DownloadIcon data-icon="inline-start" /> Pobierz JSON
    </Button>
  );
}
