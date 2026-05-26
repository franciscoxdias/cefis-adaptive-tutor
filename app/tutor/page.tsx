import Link from "next/link";
import TutorChat from "./TutorChat";

export const metadata = {
  title: "Tutor · CEFIS Adaptive Tutor",
  description: "Pergunte ao tutor com IA ancorado no conteúdo real da CEFIS.",
};

export default function TutorPage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-12">
      <div className="w-full max-w-md mx-auto flex flex-col gap-6 flex-1">
        <header className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Tutor com IA
            </span>
            <Link
              href="/plano"
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              ← plano de estudos
            </Link>
          </div>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Pergunte ao tutor
          </h1>
          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Respostas ancoradas no catálogo real da CEFIS. Quando há conteúdo
            relacionado, o tutor cita curso e trilha real consultada.
          </p>
        </header>

        <div className="flex-1">
          <TutorChat />
        </div>
      </div>
    </main>
  );
}
