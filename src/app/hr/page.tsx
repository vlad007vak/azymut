import { LayoutDashboardIcon } from "lucide-react";
import type { Metadata } from "next";

import { NaglowekStrony } from "@/components/naglowek-strony";
import { PanelHr } from "@/features/hr";

export const metadata: Metadata = {
  title: "Panel HR",
  description: "Wszystkie procesy ocen w jednym miejscu: etapy, terminy i przypomnienia dla oceniających.",
};

export default function HrPage() {
  return (
    <>
      <NaglowekStrony
        ikona={LayoutDashboardIcon}
        nadtytul="HR / administrator procesu"
        tytul="Panel HR"
        opis="Wszystkie procesy ocen – pierwsze i okresowe – w jednym miejscu: etap, termin i przypomnienia dla oceniających."
      />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <PanelHr />
      </div>
    </>
  );
}
