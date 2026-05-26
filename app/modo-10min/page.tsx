import Link from "next/link";
import ModoDezFlow from "./ModoDezFlow";
import { Brand } from "../components/Brand";
import { CefisRealBadge } from "../components/Badge";

export const metadata = {
  title: "Tenho 10 minutos · CEFIS Adaptive Tutor",
  description:
    "Síntese rápida de um tópico combinando trechos reais de aulas da CEFIS.",
};

export default function ModoDezPage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-12">
      <div className="w-full max-w-md sm:max-w-2xl lg:max-w-3xl mx-auto flex flex-col gap-8 fade-in">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Brand size="sm" />
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-foreground transition"
            >
              ← início
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-white">
                <span aria-hidden>⚡</span>
                Modo expresso
              </span>
              <CefisRealBadge label="trechos reais com timestamp" />
            </div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Tenho 10 minutos
            </h1>
            <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Diga o tópico. O tutor consulta o catálogo da CEFIS, extrai
              trechos reais das aulas e devolve uma síntese curta com
              pontos-chave referenciados a aula e timestamp.
            </p>
          </div>
        </header>

        <ModoDezFlow />
      </div>
    </main>
  );
}
