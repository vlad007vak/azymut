import { Info, LogIn } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { NaglowekStrony } from "@/components/naglowek-strony";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WyborRoli, WyborRoliSzkielet } from "@/features/role";

export const metadata: Metadata = {
  title: "Wybór roli",
  description: "Wejdź do prototypu jako przełożony (oceniający) albo HR / administrator procesu.",
};

export default function LogowaniePage() {
  return (
    <>
      <NaglowekStrony
        ikona={LogIn}
        nadtytul="Logowanie do prototypu"
        tytul="Wybierz rolę"
        opis="Rola decyduje, co widzisz w aplikacji. Przełożony prowadzi oceny swoich pracowników, HR pilnuje terminów i przypomnień w całym urzędzie."
      />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <Alert role="note" className="px-4 py-3 shadow-xs">
          <Info aria-hidden />
          <AlertTitle>Prototyp – role demonstracyjne</AlertTitle>
          <AlertDescription>
            Wybór roli nie wymaga hasła i jest zapamiętywany w tej przeglądarce. Docelowo logowanie przez system
            urzędu (np. SSO / Active Directory), a uprawnienia sprawdza serwer.
          </AlertDescription>
        </Alert>

        <Suspense fallback={<WyborRoliSzkielet />}>
          <WyborRoli />
        </Suspense>
      </div>
    </>
  );
}
