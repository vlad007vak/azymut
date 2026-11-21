/** Przykładowe OSP od organizatora – ładowane dopiero po kliknięciu (nie obciążają strony). */
export const PRZYKLADY_OSP = [
  {
    id: "starszy-specjalista",
    etykieta: "Starszy specjalista",
    opis: "DC WZKSOiC 6 · Departament Cyberbezpieczeństwa",
    wczytaj: () => import("./starszy-specjalista").then((m) => m.default),
  },
  {
    id: "radca",
    etykieta: "Radca",
    opis: "DSI WWI 5 · Departament Rozwoju i Bezpieczeństwa SI",
    wczytaj: () => import("./radca").then((m) => m.default),
  },
  {
    id: "naczelnik-wydzialu",
    etykieta: "Naczelnik wydziału",
    opis: "DWM WKAM 1 · Departament Współpracy Międzynarodowej",
    wczytaj: () => import("./naczelnik-wydzialu").then((m) => m.default),
  },
] as const;
