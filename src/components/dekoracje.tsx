import { cn } from "@/lib/utils";

/**
 * Cienkie łuki w tle granatowych sekcji (nagłówek strony, baner startowy).
 * Kontener rodzica musi mieć `relative overflow-hidden`; treść – `relative`.
 */
export function TloLinie({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 400"
      preserveAspectRatio="xMaxYMid slice"
      className={cn("pointer-events-none absolute inset-0 h-full w-full text-[#7f9bd1]", className)}
      aria-hidden
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M120 420C320 300 520 330 820 120" strokeOpacity="0.28" />
        <path d="M180 430C380 320 560 350 830 170" strokeOpacity="0.18" />
        <path d="M260 440C440 350 600 380 840 230" strokeOpacity="0.12" />
        <path d="M60 -20C300 120 560 60 820 -40" strokeOpacity="0.14" />
      </g>
    </svg>
  );
}

/** Duża róża wiatrów jako znak wodny banera startowego (własny rysunek). */
export function RozaWiatrow({ className }: { className?: string }) {
  const promienie = Array.from({ length: 16 }, (_, i) => i * 22.5);
  return (
    <svg
      viewBox="0 0 400 400"
      className={cn("pointer-events-none text-[#7f9bd1]", className)}
      aria-hidden
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="200" cy="200" r="190" strokeOpacity="0.22" />
        <circle cx="200" cy="200" r="150" strokeOpacity="0.16" />
        <circle cx="200" cy="200" r="92" strokeOpacity="0.2" />
        <circle cx="200" cy="200" r="26" strokeOpacity="0.3" />
        {promienie.map((kat) => (
          <line
            key={kat}
            x1="200"
            y1="200"
            x2="200"
            y2={kat % 90 === 0 ? 10 : kat % 45 === 0 ? 50 : 62}
            strokeOpacity={kat % 90 === 0 ? 0.3 : 0.14}
            transform={`rotate(${kat} 200 200)`}
          />
        ))}
        {/* Gwiazda czteroramienna */}
        <path
          d="M200 22 222 178 378 200 222 222 200 378 178 222 22 200 178 178Z"
          strokeOpacity="0.38"
          strokeLinejoin="round"
        />
        <path d="M200 22 200 378M22 200 378 200" strokeOpacity="0.18" />
        <path d="M200 112 212 188 288 200 212 212 200 288 188 212 112 200 188 188Z" strokeOpacity="0.3" transform="rotate(45 200 200)" />
      </g>
    </svg>
  );
}
