/**
 * Publiczne API funkcji „Analiza opisu stanowiska (OSP)” (właściciel: Dima).
 * Do osadzenia w kreatorze: <AnalizaOsp onZastosuj={(s: OspSugestia) => …} />
 * (arkusz, przyjęte kryteria dodatkowe i wskaźniki – tylko to, co przełożony zaakceptował).
 */
export { AnalizaOsp } from "./analiza-osp";
export { odczytajArkusz, wyczyscOsp, type OdczytArkusza } from "./analiza";
