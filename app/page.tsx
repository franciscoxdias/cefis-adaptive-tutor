import Link from "next/link";
import { Brand } from "./components/Brand";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header sticky com backdrop-blur */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 flex h-16 items-center justify-between">
          <Brand size="sm" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground hidden sm:inline">
            CEFIS Hackathon · 26/05/2026
          </span>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 lg:py-24 fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left: proposta */}
              <div className="lg:col-span-7 flex flex-col items-start">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft border border-brand/30 text-brand font-semibold text-xs mb-6 uppercase tracking-wider">
                  <span aria-hidden>●</span>
                  Camada adaptativa · Catálogo real CEFIS
                </div>

                <h1 className="font-bold tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mb-6">
                  Aprenda com{" "}
                  <span className="text-brand bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
                    direção
                  </span>
                  .
                  <br />
                  Não com mais conteúdo.
                </h1>

                <p className="text-muted-foreground text-base sm:text-lg lg:text-xl mb-8 max-w-2xl leading-relaxed">
                  O <strong className="text-foreground">CEFIS Compass</strong>{" "}
                  é uma bússola de aprendizagem com IA que ajuda você a
                  descobrir por onde começar, o que estudar e quais aulas reais
                  da CEFIS consultar agora.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Link
                    href="/onboarding"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-bold text-brand-foreground transition hover:bg-brand/90 shadow-glow"
                  >
                    Mapear meu caminho
                    <span
                      aria-hidden
                      className="transition group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </Link>
                  <Link
                    href="/modo-10min"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/40 px-6 py-4 text-base font-bold text-accent transition hover:bg-accent/10"
                  >
                    <span aria-hidden>⚡</span>
                    Tenho 10 minutos
                  </Link>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-3 mt-10 pt-8 border-t border-border w-full">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full bg-brand"
                    />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Grounded em transcrições reais
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full bg-accent"
                    />
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Cita curso, aula e timestamp
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: 3 cards de pilares */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <PillarCard
                  step="01"
                  title="Diagnóstico"
                  desc="Onboarding rápido e perguntas adaptativas mapeiam o que você ainda precisa aprender."
                />
                <PillarCard
                  step="02"
                  title="Plano de estudos"
                  desc="Combina trilhas e cursos reais do catálogo CEFIS com etapas conceituais."
                />
                <PillarCard
                  step="03"
                  title="Tutor + Modo 10 min"
                  desc="Responde dúvidas citando aula e timestamp. Síntese rápida quando o tempo aperta."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Bloco honestidade — diferenciado */}
        <section className="border-t border-border bg-card/30">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
            <div className="max-w-3xl flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 text-accent font-semibold text-xs uppercase tracking-wider">
                <span aria-hidden>◆</span>
                Honestidade por design
              </div>
              <h2 className="font-bold text-2xl sm:text-3xl leading-tight">
                Quando o catálogo cobre o tema, o Compass cita aula e timestamp
                reais.
                <br />
                <span className="text-muted-foreground font-normal">
                  Quando não cobre, gera material complementar com aviso
                  honesto — sem inventar curso CEFIS.
                </span>
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                A inteligência do Compass usa duas camadas: busca grounded nas
                transcrições oficiais da CEFIS + adapter LLM provider-agnóstico.
                Quando o tema sai da cobertura do catálogo, o sistema avisa e
                marca o conteúdo como{" "}
                <span className="text-accent font-semibold">
                  Material complementar gerado por IA
                </span>
                .
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 flex flex-col sm:flex-row gap-2 justify-between text-xs text-muted-foreground">
          <span>
            Protótipo funcional desenvolvido para o{" "}
            <span className="text-foreground font-medium">
              CEFIS Hackathon de Inovação em Aprendizado
            </span>
          </span>
          <span>26 de maio de 2026 · Orlando</span>
        </div>
      </footer>
    </div>
  );
}

function PillarCard({
  step,
  title,
  desc,
}: {
  step: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="glow-card rounded-xl p-5 flex items-start gap-4">
      <span className="shrink-0 h-9 w-9 rounded-lg bg-brand-soft border border-brand/30 text-brand font-bold text-sm flex items-center justify-center">
        {step}
      </span>
      <div className="flex flex-col gap-1 min-w-0">
        <h3 className="font-bold text-base">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
