/** Publiczne API funkcji „Eksport oceny do JSON” (Dima). */
import { PrzyciskEksportu } from "./przycisk-eksportu";
import type { EksportOceny as DokumentEksportu } from "./typy";

/** Przycisk „Pobierz JSON”: `<EksportOceny ocena={ocena} />` (ten sam komponent co `PrzyciskEksportu`). */
export const EksportOceny = PrzyciskEksportu;
/** Dokument wymiany `azymut.ocena` v1 – wynik `eksportujOcene(ocena)`. */
export type EksportOceny = DokumentEksportu;

export { BladEksportu, eksportujOcene, nazwaPlikuEksportu, type OpcjeEksportu } from "./eksport";
export { PrzyciskEksportu, type PrzyciskEksportuProps } from "./przycisk-eksportu";
export {
  FORMAT_EKSPORTU,
  type KryteriumEksportu,
  type PoziomEksportu,
  WERSJA_EKSPORTU,
  type WskaznikEksportu,
  type WynikEksportu,
} from "./typy";
