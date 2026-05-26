import Link from "next/link";

export const metadata = {
  title: "Diagnóstico · CEFIS Adaptive Tutor",
};

export default function DiagnosticoPage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-12">
      <div className="w-full max-w-md mx-auto flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Passo 2 de 3
          </span>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Diagnóstico de lacunas
          </h1>
          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Em construção. Aqui o tutor vai gerar perguntas adaptadas ao seu
            objetivo e mapear o que você ainda precisa aprender.
          </p>
        </header>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Esta tela vai integrar o LLM para gerar 3 a 5 perguntas
            personalizadas a partir do objetivo declarado no onboarding.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/plano"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-4 text-base font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            Ver plano de estudos (placeholder)
          </Link>
          <Link
            href="/onboarding"
            className="text-center text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ← voltar ao onboarding
          </Link>
        </div>
      </div>
    </main>
  );
}
