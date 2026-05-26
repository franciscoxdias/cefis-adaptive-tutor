import Link from "next/link";
import { Brand } from "./components/Brand";
import { CefisRealBadge } from "./components/Badge";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-12">
      <div className="w-full max-w-md sm:max-w-2xl lg:max-w-3xl mx-auto flex flex-col gap-10 flex-1">
        <header className="flex items-center justify-between">
          <Brand size="md" />
          <span className="text-xs text-zinc-500">CEFIS Hackathon</span>
        </header>

        <section className="flex flex-col gap-7 fade-in flex-1 justify-center">
          <div className="flex flex-col gap-4">
            <CefisRealBadge label="ancorado em catálogo e aulas reais da CEFIS" />
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              Aprenda mais rápido,
              <br />
              <span className="text-brand">com o conteúdo</span>
              <br />
              que a CEFIS já tem.
            </h1>
            <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Conta o seu objetivo. O tutor monta um diagnóstico, um plano e
              responde dúvidas citando trechos de aula reais — com aula e
              timestamp.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/onboarding"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-4 text-base font-medium text-white shadow-lg shadow-brand/20 transition hover:bg-brand-soft hover:shadow-xl"
            >
              Começar jornada completa
              <span
                aria-hidden
                className="transition group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
            <p className="text-xs text-zinc-500 text-center">
              Onboarding → Diagnóstico → Plano → Tutor · ~3 minutos
            </p>

            <div className="flex items-center gap-3 my-2">
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              <span className="text-xs text-zinc-400 uppercase tracking-wider">
                ou
              </span>
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            </div>

            <Link
              href="/modo-10min"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white/80 backdrop-blur px-5 py-3.5 text-sm font-medium text-foreground transition hover:border-brand hover:text-brand dark:border-zinc-700 dark:bg-zinc-950/60 dark:hover:border-brand"
            >
              <span aria-hidden>⚡</span>
              Tenho 10 minutos
            </Link>
            <p className="text-xs text-zinc-500 text-center">
              Diga o tópico, receba a síntese com trechos de aula.
            </p>
          </div>
        </section>

        <footer className="flex flex-col gap-1.5 text-xs text-zinc-400 border-t border-zinc-200 pt-5 dark:border-zinc-800">
          <span>
            Projeto desenvolvido para o{" "}
            <span className="font-medium text-zinc-600 dark:text-zinc-300">
              CEFIS Hackathon de Inovação em Aprendizado
            </span>
          </span>
          <span>26 de maio de 2026 · Orlando</span>
        </footer>
      </div>
    </main>
  );
}
