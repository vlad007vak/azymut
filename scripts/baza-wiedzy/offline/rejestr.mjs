// Hook modułów: pozwala Node 24 zaimportować src/features/asystent/*.ts bez Next.js
// (alias @/ → src/, „server-only” → pusty moduł, import bez rozszerzenia → .ts, .json → JSON).
// Użycie: node --no-warnings --import ./scripts/baza-wiedzy/offline/rejestr.mjs <skrypt>
import { register } from "node:module";
import { fileURLToPath } from "node:url";

// Katalog główny repozytorium (trzy poziomy wyżej) albo zmienna REPO_ROOT.
const ROOT = (process.env.REPO_ROOT ?? fileURLToPath(new URL("../../..", import.meta.url))).replaceAll("\\", "/").replace(/\/$/, "");
const hooki = `
import { pathToFileURL, fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
const ROOT = ${JSON.stringify(ROOT)};
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) spec = pathToFileURL(ROOT + "/src/" + spec.slice(2)).href;
  if (spec.startsWith("file:") || spec.startsWith(".")) {
    const base = spec.startsWith(".") ? new URL(spec, ctx.parentURL).href : spec;
    const p = fileURLToPath(base);
    for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
      if (existsSync(p + ext) && !(ext === "" && !/\\.[a-z]+$/i.test(p))) {
        const url = pathToFileURL(p + ext).href;
        if (url.endsWith(".json")) return { url, format: "json", importAttributes: { type: "json" }, shortCircuit: true };
        if (url.endsWith(".ts")) return { url, format: "module-typescript", shortCircuit: true };
        return { url, shortCircuit: true };
      }
    }
  }
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (url.endsWith(".json")) return next(url, { ...ctx, format: "json", importAttributes: { type: "json" } });
  if (url.endsWith(".ts")) return next(url, { ...ctx, format: "module-typescript" });
  return next(url, ctx);
}
`;
register("data:text/javascript," + encodeURIComponent(hooki));
