import Link from "next/link";
import TutorChat from "./TutorChat";
import { Brand } from "../components/Brand";
import { CefisRealBadge } from "../components/Badge";

export const metadata = {
  title: "Tutor · CEFIS Adaptive Tutor",
  description: "Pergunte ao tutor com IA ancorado no conteúdo real da CEFIS.",
};

export default function TutorPage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-12">
      <div className="w-full max-w-md mx-auto flex flex-col gap-6 flex-1 fade-in">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Brand size="sm" />
            <Link
              href="/plano"
              className="text-xs text-zinc-500 hover:text-foreground transition"
            >
              ← plano
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <CefisRealBadge label="responde com trechos de aula reais" />
            </div>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Pergunte ao tutor
            </h1>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              O tutor consulta o catálogo da CEFIS, extrai trechos das aulas e
              cita aula + timestamp em cada resposta.
            </p>
          </div>
        </header>

        <div className="flex-1">
          <TutorChat />
        </div>
      </div>
    </main>
  );
}
