import Link from "next/link";
import ModoDezFlow from "./ModoDezFlow";

export const metadata = {
  title: "Tenho 10 minutos · CEFIS Adaptive Tutor",
  description:
    "Síntese rápida de um tópico combinando trechos reais de aulas da CEFIS.",
};

export default function ModoDezPage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-12">
      <div className="w-full max-w-md mx-auto flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Modo expresso
            </span>
            <Link
              href="/"
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              início
            </Link>
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Tenho 10 minutos
          </h1>
          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Diga o tópico. O tutor consulta o catálogo da CEFIS, extrai trechos
            reais das aulas e devolve uma síntese curta com pontos-chave e
            referências a aula e timestamp.
          </p>
        </header>

        <ModoDezFlow />
      </div>
    </main>
  );
}
