import DiagnosticoFlow from "./DiagnosticoFlow";
import { Brand } from "../components/Brand";
import { Stepper } from "../components/Stepper";

export const metadata = {
  title: "Diagnóstico · CEFIS Compass",
  description: "Perguntas adaptadas ao seu objetivo pra mapear lacunas.",
};

export default function DiagnosticoPage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-12">
      <div className="w-full max-w-md sm:max-w-2xl mx-auto flex flex-col gap-8 fade-in">
        <header className="flex flex-col gap-4">
          <Brand size="sm" />
          <Stepper current={2} />
        </header>

        <section className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Diagnóstico de lacunas
          </h1>
          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Algumas perguntas curtas pra mapear o que você já sabe e o que
            ainda precisa aprender pra atingir seu objetivo.
          </p>
        </section>

        <DiagnosticoFlow />
      </div>
    </main>
  );
}
