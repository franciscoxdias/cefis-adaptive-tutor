import Image from "next/image";
import Link from "next/link";
import { Brand } from "./components/Brand";
import { CompassArt } from "./components/CompassArt";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ════════════ HEADER ════════════ */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 flex h-16 items-center justify-between">
          <Brand size="sm" />
          <div className="hidden md:flex items-center gap-6 text-xs uppercase tracking-wider text-muted-foreground">
            <a href="#sobre" className="hover:text-brand transition">Sobre</a>
            <a href="#ecossistema" className="hover:text-brand transition">Ecossistema</a>
            <a href="#jornada" className="hover:text-brand transition">Jornada</a>
            <a href="#diferenciais" className="hover:text-brand transition">Diferenciais</a>
            <a href="#faq" className="hover:text-brand transition">FAQ</a>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Powered by</span>
            <Image
              src="/logo-cefis.png"
              alt="CEFIS"
              width={20}
              height={20}
              className="opacity-70"
            />
            <span className="font-bold text-foreground">CEFIS</span>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ════════════ HERO ════════════ */}
        <section className="relative overflow-hidden">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-20 lg:py-24 fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              {/* ───── Bloco esquerdo: branding + headline + CTAs ───── */}
              <div className="lg:col-span-7 flex flex-col items-start order-1 lg:order-1">
                {/* (a) Micro-label institucional */}
                <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-card border border-border text-[11px] mb-7">
                  <Image
                    src="/logo-cefis.png"
                    alt="CEFIS"
                    width={16}
                    height={16}
                    className="opacity-80"
                  />
                  <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                    Powered by conteúdo real da CEFIS
                  </span>
                </div>

                {/* (b) Marca produto CEFIS Compass */}
                <div className="flex flex-col gap-1 mb-6">
                  <h2 className="font-bold text-2xl sm:text-3xl tracking-tight leading-none">
                    CEFIS{" "}
                    <span className="text-brand bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
                      Compass
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-[0.2em]">
                    Adaptive Learning Tutor
                  </p>
                </div>

                {/* (c) Headline */}
                <h1 className="font-bold tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-[1.05] mb-6">
                  Não consuma conteúdo.
                  <br />
                  <span className="text-brand bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent">
                    Domine disciplinas.
                  </span>
                </h1>

                {/* (d) Subheadline */}
                <p className="text-muted-foreground text-base sm:text-lg lg:text-xl mb-8 max-w-2xl leading-relaxed">
                  Uma camada adaptativa de aprendizagem com IA que guia o aluno
                  pelo acervo real da CEFIS, identifica lacunas e estrutura uma
                  rota personalizada de estudos.
                </p>

                {/* (e) CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Link
                    href="/onboarding"
                    className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-4 text-base font-bold text-brand-foreground transition hover:bg-brand/90 shadow-glow"
                  >
                    Mapear meu caminho
                    <span aria-hidden className="transition group-hover:translate-x-1">→</span>
                  </Link>
                  <Link
                    href="/modo-10min"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/40 px-6 py-4 text-base font-bold text-accent transition hover:bg-accent/10"
                  >
                    <span aria-hidden>⚡</span>
                    Síntese de 10 minutos
                  </Link>
                </div>

                {/* (f) Trust badges */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-10 pt-8 border-t border-border w-full">
                  <SafeBadge dot="brand">Grounding ativo em aulas reais</SafeBadge>
                  <SafeBadge dot="brand">Tutor adaptativo</SafeBadge>
                  <SafeBadge dot="accent">Material complementar IA</SafeBadge>
                  <SafeBadge dot="accent">Modo 10 minutos</SafeBadge>
                </div>
              </div>

              {/* ───── Bloco direito: compass art + 2 PillarCards ───── */}
              <div className="lg:col-span-5 flex flex-col items-center gap-6 order-2 lg:order-2">
                {/* Compass art como âncora visual */}
                <div className="relative flex items-center justify-center w-full">
                  <CompassArt size={400} className="w-full max-w-[400px]" />
                </div>

                {/* 2 PillarCards visuais complementando */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 w-full max-w-[420px]">
                  <PillarCard
                    step="01"
                    title="Diagnóstico + Plano"
                    desc="Onboarding mapeia perfil. Plano combina trilhas e cursos reais com etapas conceituais."
                  />
                  <PillarCard
                    step="02"
                    title="Tutor + Modo 10 min"
                    desc="Respostas citando aula e timestamp. Síntese rápida quando o tempo aperta."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════ SOBRE ════════════ */}
        <section id="sobre" className="border-t border-border bg-card/30">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-5 flex flex-col gap-4">
                <SectionLabel icon="◆" color="brand">Sobre o CEFIS Compass</SectionLabel>
                <h2 className="font-bold text-3xl sm:text-4xl leading-tight">
                  A bússola que transforma curiosidade em domínio real.
                </h2>
              </div>
              <div className="lg:col-span-7 text-muted-foreground text-base sm:text-lg leading-relaxed">
                <p>
                  O CEFIS Compass atua como um sistema de navegação personalizada para aprendizagem. Ele entende o objetivo do aluno, mapeia lacunas e recomenda uma rota de estudo combinando cursos, aulas e trechos reais da CEFIS com materiais complementares gerados por IA quando o catálogo não cobre diretamente o tema.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════ ECOSSISTEMA ════════════ */}
        <section id="ecossistema" className="border-t border-border">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
            <div className="text-center max-w-3xl mx-auto mb-12 flex flex-col gap-3 items-center">
              <SectionLabel icon="◢" color="accent">Ecossistema</SectionLabel>
              <h2 className="font-bold text-3xl sm:text-4xl leading-tight">
                Um ecossistema completo para aprendizado estratégico.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FeatureCard icon="◉" title="Onboarding Inteligente" desc="Mapeia objetivo, nível atual, tempo disponível e preferência de aprendizagem." />
              <FeatureCard icon="◎" title="Diagnóstico de Lacunas" desc="Identifica prioridades de estudo a partir das respostas do aluno e do objetivo informado." />
              <FeatureCard icon="▶" title="Rota de Aceleração" desc="Gera um plano combinando etapas conceituais, cursos reais da CEFIS e materiais de apoio." />
              <FeatureCard icon="◆" title="Tutor com Grounding" desc="Responde dúvidas com base em trechos reais quando há cobertura CEFIS e separa material complementar quando não há." />
              <FeatureCard icon="▣" title="Integração com Catálogo" desc="Consulta cursos, aulas, trilhas e legendas para encontrar conteúdo relevante." />
              <FeatureCard icon="✓" title="Citações Verificáveis" desc="Quando disponíveis, mostra curso, aula, trechos e timestamps reais." />
              <FeatureCard icon="✦" title="Aula Complementar IA" desc="Quando o catálogo não cobre diretamente o tema, gera uma aula complementar personalizada com aviso claro." />
              <FeatureCard icon="⚡" title="Síntese de 10 Minutos" desc="Condensa o essencial de um tema em uma experiência rápida, útil e orientada." />
            </div>
          </div>
        </section>

        {/* ════════════ JORNADA ════════════ */}
        <section id="jornada" className="border-t border-border bg-card/30">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
            <div className="text-center max-w-3xl mx-auto mb-12 flex flex-col gap-3 items-center">
              <SectionLabel icon="↗" color="brand">Jornada</SectionLabel>
              <h2 className="font-bold text-3xl sm:text-4xl leading-tight">
                Como o CEFIS Compass acelera seu domínio.
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-5">
              <JourneyStep num="01" highlight title="Meta Definida" desc="O aluno informa seu objetivo de carreira ou tema de interesse." />
              <JourneyStep num="02" title="Onboarding" desc="Responde perguntas sobre nível atual, tempo disponível e forma preferida de aprender." />
              <JourneyStep num="03" title="Diagnóstico" desc="O Compass mapeia lacunas e prioridades de conhecimento." />
              <JourneyStep num="04" title="Plano" desc="Recebe uma rota personalizada com etapas conceituais e conteúdo CEFIS quando disponível." />
              <JourneyStep num="05" title="Estudo Focado" desc="Consulta aulas, trechos e materiais complementares organizados para o objetivo." />
              <JourneyStep num="06" title="Tutor" desc="Tira dúvidas com uma IA que separa conteúdo oficial CEFIS de material complementar." />
              <JourneyStep num="07" highlight accent title="Evolução" desc="Em produção, a experiência pode se conectar ao histórico real, progresso e certificados do aluno." />
            </div>
          </div>
        </section>

        {/* ════════════ DIFERENCIAIS ════════════ */}
        <section id="diferenciais" className="border-t border-border">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
            <div className="text-center max-w-3xl mx-auto mb-12 flex flex-col gap-3 items-center">
              <SectionLabel icon="✦" color="accent">Diferenciais</SectionLabel>
              <h2 className="font-bold text-3xl sm:text-4xl leading-tight">
                Por que o CEFIS Compass é diferente de um chatbot comum.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Differential title="Direção Inteligente" desc="Não é apenas um chat genérico. O Compass organiza uma jornada de aprendizagem a partir do objetivo do aluno." />
              <Differential title="Grounding em Conteúdo Real" desc="Quando há cobertura CEFIS, as respostas são ancoradas em cursos, aulas, transcrições e timestamps reais." />
              <Differential title="Complemento Honesto por IA" desc="Quando o catálogo não cobre diretamente o tema, o Compass gera material complementar e deixa claro que não é uma aula oficial CEFIS." />
              <Differential title="Respeito ao Tempo" desc="Com o modo Tenho 10 Minutos, o aluno recebe uma síntese rápida para estudar mesmo com pouco tempo." />
              <Differential title="Fallback Seguro" desc="Se o provider LLM falhar, o app preserva a experiência com fallback determinístico." />
              <Differential title="Arquitetura Evolutiva" desc="O MVP está preparado para evoluir para login real, progresso, certificados, voz e personalização contínua." />
            </div>
          </div>
        </section>

        {/* ════════════ FAQ ════════════ */}
        <section id="faq" className="border-t border-border bg-card/30">
          <div className="container max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24">
            <div className="text-center mb-12 flex flex-col gap-3 items-center">
              <SectionLabel icon="?" color="brand">Dúvidas frequentes</SectionLabel>
              <h2 className="font-bold text-3xl sm:text-4xl leading-tight">
                Perguntas Frequentes
              </h2>
            </div>
            <div className="flex flex-col gap-3">
              <FaqItem q="O que é o CEFIS Compass?" a="O CEFIS Compass é uma camada adaptativa de aprendizagem com IA. Ele ajuda o aluno a transformar um objetivo de estudo em diagnóstico, plano, tutor contextual e sínteses rápidas, conectando o conteúdo real da CEFIS com materiais complementares gerados por IA quando necessário." />
              <FaqItem q="Ele substitui os cursos da CEFIS?" a="Não. Ele é complementar. O Compass ajuda o aluno a navegar melhor pelo acervo da CEFIS, indicando cursos, aulas, trechos e timestamps quando há cobertura real no catálogo." />
              <FaqItem q="Como funciona o diagnóstico de lacunas?" a="O diagnóstico usa as respostas do aluno no onboarding para mapear nível atual, objetivo, tempo disponível e principais lacunas percebidas. No MVP, esse perfil é informado pelo próprio aluno; em produção, pode ser enriquecido com login, histórico, progresso e certificados." />
              <FaqItem q="O plano de estudo é igual para todos?" a="Não. O plano considera objetivo, nível, tempo disponível e preferência de aprendizagem. Ele combina etapas conceituais, conteúdo CEFIS quando disponível e material complementar gerado por IA quando necessário." />
              <FaqItem q="O tutor cria materiais personalizados?" a="Sim, o tutor pode gerar sínteses, pontos-chave, exemplos práticos e checklists personalizados. Quando houver conteúdo CEFIS relevante, ele prioriza aulas e trechos reais. Quando não houver cobertura direta, o material é rotulado como complementar gerado por IA." />
              <FaqItem q="O que acontece se o tema não estiver no catálogo da CEFIS?" a="O Compass informa que não encontrou cobertura direta no catálogo e gera uma aula complementar personalizada por IA, sem inventar curso, aula, professor, ID ou timestamp da CEFIS." />
              <FaqItem q="O que torna o Compass diferente de um chatbot comum?" a="Um chatbot comum responde de forma isolada. O Compass conecta onboarding, diagnóstico, plano, tutor e modo 10 minutos, priorizando conteúdo real da CEFIS quando disponível e mantendo separação clara entre oficial e complementar." />
              <FaqItem q="O Compass já usa login real do aluno?" a="No MVP de hackathon, o perfil é simulado via onboarding. Em produção, a arquitetura pode ser integrada ao login/SSO da CEFIS, progresso, certificados e histórico real do aluno." />
            </div>
          </div>
        </section>

        {/* ════════════ CTA FINAL ════════════ */}
        <section className="border-t border-border">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-20 text-center flex flex-col gap-6 items-center">
            <SectionLabel icon="🧭" color="brand">Evolução com direção</SectionLabel>
            <h2 className="font-bold text-3xl sm:text-4xl lg:text-5xl leading-tight">
              Comece com um objetivo.
              <br />
              Receba uma rota.
              <br />
              <span className="text-brand">Evolua com direção.</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full sm:w-auto">
              <Link
                href="/onboarding"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-8 py-4 text-base font-bold text-brand-foreground transition hover:bg-brand/90 shadow-glow"
              >
                Mapear meu caminho
                <span aria-hidden className="transition group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/modo-10min"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/40 px-8 py-4 text-base font-bold text-accent transition hover:bg-accent/10"
              >
                <span aria-hidden>⚡</span>
                Testar Modo 10 Minutos
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="border-t border-border">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-6 flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-cefis.png"
              alt="CEFIS"
              width={20}
              height={20}
              className="opacity-70"
            />
            <span>
              Protótipo funcional de hackathon ·{" "}
              <span className="text-foreground font-medium">
                CEFIS Hackathon de Inovação em Aprendizado
              </span>
            </span>
          </div>
          <span>26 de maio de 2026 · Orlando</span>
        </div>
      </footer>
    </div>
  );
}

/* ════════════ COMPONENTES ════════════ */

function SafeBadge({
  children,
  dot,
}: {
  children: React.ReactNode;
  dot: "brand" | "accent";
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className={`h-2 w-2 rounded-full ${dot === "brand" ? "bg-brand" : "bg-accent"}`}
      />
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {children}
      </span>
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

function SectionLabel({
  children,
  icon,
  color,
}: {
  children: React.ReactNode;
  icon: string;
  color: "brand" | "accent";
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 font-bold text-xs uppercase tracking-wider ${color === "brand" ? "text-brand" : "text-accent"}`}
    >
      <span aria-hidden>{icon}</span>
      {children}
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="glow-card rounded-xl p-5 flex flex-col gap-3">
      <div className="h-10 w-10 rounded-lg bg-brand-soft border border-brand/30 flex items-center justify-center text-brand text-lg">
        <span aria-hidden>{icon}</span>
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="font-bold text-base">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function JourneyStep({
  num,
  title,
  desc,
  highlight = false,
  accent = false,
}: {
  num: string;
  title: string;
  desc: string;
  highlight?: boolean;
  accent?: boolean;
}) {
  const bg = accent
    ? "bg-accent text-accent-foreground"
    : highlight
      ? "bg-brand text-brand-foreground"
      : "bg-brand-soft border border-brand/30 text-brand";
  const ringShadow = highlight
    ? accent
      ? "shadow-[0_0_15px_-3px_oklch(0.765_0.182_76.81/50%)]"
      : "shadow-[0_0_15px_-3px_oklch(0.705_0.191_165.57/50%)]"
    : "";

  return (
    <div className="flex flex-col gap-3">
      <div
        className={`h-10 w-10 rounded-full font-bold flex items-center justify-center text-sm ${bg} ${ringShadow}`}
      >
        {num}
      </div>
      <div>
        <h4 className="font-bold text-base mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Differential({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="h-6 w-6 rounded-full bg-brand-soft border border-brand/30 flex items-center justify-center shrink-0 mt-1 text-brand text-xs">
        <span aria-hidden>✓</span>
      </div>
      <div>
        <h4 className="font-bold text-lg mb-2 text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="glow-card rounded-xl p-5 group">
      <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-bold text-base hover:text-brand transition">
        <span>{q}</span>
        <span
          aria-hidden
          className="text-brand text-xl shrink-0 transition group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <p className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground leading-relaxed">
        {a}
      </p>
    </details>
  );
}
