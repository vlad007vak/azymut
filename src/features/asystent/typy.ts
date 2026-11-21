import type { AsystentOdpowiedz, ZrodloOdpowiedzi } from "@/types/api";

/** Źródło z dodatkowymi polami do podglądu w UI (pełny fragment). Zgodne z kontraktem. */
export interface ZrodloAsystenta extends ZrodloOdpowiedzi {
  id: string;
  /** Pełny tekst fragmentu bazy wiedzy, z którego pochodzi cytat. */
  tekst: string;
}

/** Odpowiedź POST /api/asystent – rozszerza kontrakt `AsystentOdpowiedz`. */
export interface OdpowiedzAsystenta extends AsystentOdpowiedz {
  zrodla: ZrodloAsystenta[];
  /** true → z pytania usunięto imiona/nazwiska przed wysłaniem do AI. */
  zanonimizowano: boolean;
  /** Dostawca AI, który odpowiedział (brak → odpowiedź bez udziału AI). */
  dostawca?: string;
}
