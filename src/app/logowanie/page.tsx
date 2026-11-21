import { Info } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WyborRoli, WyborRoliSzkielet } from "@/features/role";

export const metadata: Metadata = {
  title: "Wybór roli",
  description: "Wejdź do prototypu jako przełożony (oceniający) albo HR / administrator procesu.",
};

export default function LogowaniePage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Wybierz rolę</h1>
        <p className="max-w-3xl text-muted-foreground">
          Rola decyduje, co widzisz w aplikacji. Przełożony prowadzi oceny swoich pracowników, HR pilnuje
          terminów i przypomnień w całym urzędzie.
        </p>
      </header>

      <Alert role="note">
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
  );
}
