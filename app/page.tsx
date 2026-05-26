import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-between px-6 py-10 sm:px-10 sm:py-16">
      <header className="w-full max-w-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rounded-full bg-emerald-500"
          />
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            v0.1 — em construção
          </span>
        </div>
        <span className="text-xs text-zinc-400">CEFIS Hackathon</span>
      </header>

      <section className="w-full max-w-md flex flex-col items-start gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            CEFIS
            <br />
            <span className="font-normal text-zinc-500">Adaptive Tutor</span>
          </h1>
          <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
            Aprendizado personalizado a partir do conteúdo real da CEFIS.
            Conta o seu objetivo, recebe um plano de estudos adaptado ao seu
            nível e tempo disponível.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/onboarding"
            className="inline-flex items-center justify-center rounded-xl bg-zinc-900 px-5 py-4 text-base font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
          >
            Começar jornada completa
          </Link>
          <p className="text-xs text-zinc-500 text-center">
            Onboarding → diagnóstico → plano → tutor. ~3 minutos.
          </p>

          <div className="flex items-center gap-3 my-1">
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            <span className="text-xs text-zinc-400 uppercase tracking-wider">ou</span>
            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          </div>

          <Link
            href="/modo-10min"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-900 transition hover:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-100"
          >
            Tenho 10 minutos
          </Link>
          <p className="text-xs text-zinc-500 text-center">
            Diga o tópico, receba uma síntese com trechos reais de aula.
          </p>
        </div>
      </section>

      <footer className="w-full max-w-md flex flex-col gap-1 text-xs text-zinc-400">
        <span>Projeto desenvolvido para o CEFIS Hackathon</span>
        <span>26 de maio de 2026</span>
      </footer>
    </main>
  );
}
