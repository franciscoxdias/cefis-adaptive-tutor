import Link from "next/link";

export const metadata = {
  title: "Plano de estudos · CEFIS Adaptive Tutor",
};

export default function PlanoPage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-12">
      <div className="w-full max-w-md mx-auto flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Passo 3 de 3
          </span>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Seu plano de estudos
          </h1>
          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Em construção. Aqui o tutor combina as trilhas oficiais da CEFIS
            com cursos do catálogo, adaptados ao seu nível e ao seu tempo
            disponível.
          </p>
        </header>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Esta tela vai integrar a API CEFIS (trilhas + cursos) com o LLM
            para montar uma sequência personalizada de estudos.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="text-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ← voltar ao início
          </Link>
        </div>
      </div>
    </main>
  );
}
