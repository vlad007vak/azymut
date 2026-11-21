import { ClipboardList, UserRound, type LucideProps } from "lucide-react";

import type { RolaId } from "./rola";

const IKONY = { przelozony: UserRound, hr: ClipboardList } satisfies Record<RolaId, unknown>;

export function IkonaRoli({ rola, ...props }: { rola: RolaId } & LucideProps) {
  const Ikona = IKONY[rola];
  return <Ikona aria-hidden {...props} />;
}
