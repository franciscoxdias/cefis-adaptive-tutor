import PlanoFlow from "./PlanoFlow";
import { Brand } from "../components/Brand";
import { Stepper } from "../components/Stepper";

export const metadata = {
  title: "Plano de estudos · CEFIS Adaptive Tutor",
  description: "Plano de estudos personalizado combinando o catálogo da CEFIS.",
};

export default function PlanoPage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-12">
      <div className="w-full max-w-md mx-auto flex flex-col gap-8 fade-in">
        <header className="flex flex-col gap-4">
          <Brand size="sm" />
          <Stepper current={3} />
        </header>

        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Seu plano de estudos
          </h1>
          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Etapas combinando trilhas e cursos reais da CEFIS com tópicos
            conceituais pra cobrir o que faltava no seu objetivo.
          </p>
        </section>

        <PlanoFlow />
      </div>
    </main>
  );
}
