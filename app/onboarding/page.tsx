import OnboardingForm from "./OnboardingForm";

export const metadata = {
  title: "Onboarding · CEFIS Adaptive Tutor",
  description: "Conta o seu objetivo pra recebermos um plano de estudos adaptado.",
};

export default function OnboardingPage() {
  return (
    <main className="flex flex-1 flex-col px-6 py-8 sm:px-10 sm:py-12">
      <div className="w-full max-w-md mx-auto flex flex-col gap-8">
        <header className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Passo 1 de 3
          </span>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Conta o seu objetivo
          </h1>
          <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
            Com base na sua resposta, geramos um diagnóstico curto e um plano
            de estudos personalizado usando o conteúdo real da CEFIS.
          </p>
        </header>

        <OnboardingForm />
      </div>
    </main>
  );
}
