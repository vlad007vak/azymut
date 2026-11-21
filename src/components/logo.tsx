import { cn } from "@/lib/utils";

/** Znak Azymutu: róża wiatrów w kole (własny rysunek – bez godła i logotypów instytucji). */
export function ZnakAzymut({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden focusable="false">
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="1" />
      <circle cx="16" cy="16" r="10.5" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
      {/* Igła: północ na czerwono */}
      <path d="M16 3.5 19 16h-6z" fill="var(--brand)" />
      <path d="M16 28.5 13 16h6z" fill="currentColor" />
      <path d="M3.5 16 16 14v4zM28.5 16 16 18v-4z" fill="currentColor" fillOpacity="0.55" />
      <circle cx="16" cy="16" r="1.6" fill="var(--background)" />
    </svg>
  );
}

/** Logotyp w dwóch wierszach (jak w serwisach administracji): nazwa + czego dotyczy. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <ZnakAzymut className="size-9 shrink-0" />
      <span className="grid leading-tight">
        <span className="text-base font-bold tracking-tight">Azymut</span>
        <span className="text-xs text-muted-foreground">Kompas kompetencji</span>
      </span>
    </span>
  );
}
