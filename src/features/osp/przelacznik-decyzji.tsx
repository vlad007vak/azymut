"use client";

import { CheckIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Przełącznik „Przyjmij / Odrzuć” dla jednej sugestii. */
export function PrzelacznikDecyzji({
  przyjete,
  onZmiana,
  etykieta,
  disabled,
}: {
  przyjete: boolean;
  onZmiana: (przyjete: boolean) => void;
  /** Czego dotyczy decyzja – do etykiety dostępności. */
  etykieta: string;
  disabled?: boolean;
}) {
  return (
    <div role="group" aria-label={`Decyzja: ${etykieta}`} className="flex shrink-0 gap-1">
      <Button
        type="button"
        size="sm"
        variant={przyjete ? "default" : "outline"}
        aria-pressed={przyjete}
        disabled={disabled}
        onClick={() => onZmiana(true)}
      >
        <CheckIcon data-icon="inline-start" /> Przyjmij
      </Button>
      <Button
        type="button"
        size="sm"
        variant={przyjete ? "outline" : "destructive"}
        aria-pressed={!przyjete}
        disabled={disabled}
        onClick={() => onZmiana(false)}
      >
        <XIcon data-icon="inline-start" /> Odrzuć
      </Button>
    </div>
  );
}
