import type { Metadata } from "next";

import { PanelHr } from "@/features/hr";

export const metadata: Metadata = {
  title: "Panel HR",
  description: "Wszystkie procesy ocen w jednym miejscu: etapy, terminy i przypomnienia dla oceniających.",
};

export default function HrPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <header className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Panel HR</h1>
        <p className="text-muted-foreground">
          Wszystkie procesy ocen – pierwsze i okresowe – w jednym miejscu: etap, termin i przypomnienia dla
          oceniających.
        </p>
      </header>
      <PanelHr />
    </div>
  );
}
