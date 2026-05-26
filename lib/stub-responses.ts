/**
 * Stub determinístico pra quando LLM real não estiver disponível
 * (key ausente, billing falhou, rate limit, erro intermitente).
 *
 * Princípios:
 * - NÃO inventar estatísticas / claims do catálogo CEFIS
 * - NÃO inventar nomes de cursos, professores ou trilhas
 * - Usar APENAS dados reais vindos da API CEFIS (passados como argumento)
 * - Ser explícito sobre estar em "modo limitado"
 * - Gerar respostas plausíveis e úteis mesmo sem LLM
 *
 * A UI sinaliza `source: "stub"` pra deixar claro pro usuário.
 */

import type {
  OnboardingInput,
  DiagnosticoAnswer,
  CatalogItem,
  TutorExcerpt,
} from "./prompts";

// ──────────────── Diagnóstico stub ────────────────

export function stubDiagnostico(input: OnboardingInput): {
  questions: Array<{ id: string; question: string; why: string }>;
} {
  const obj = input.objective.trim();

  // Template de 4 perguntas neutras adaptadas ao nível.
  // Não cita CEFIS nem cursos específicos.
  const base = [
    {
      id: "q1",
      question: `O que você considera o ponto mais difícil pra atingir o objetivo "${truncate(obj, 80)}"?`,
      why: "Identifica a percepção subjetiva da maior lacuna.",
    },
    {
      id: "q2",
      question:
        input.level === "iniciante"
          ? "Você já estudou algum tema relacionado antes? Se sim, qual?"
          : input.level === "intermediario"
            ? "Quais conceitos você já domina razoavelmente bem nesse tema?"
            : "Em quais aspectos você sente que precisa aprofundar pra ir do avançado pro expert?",
      why: "Calibra o ponto de partida em relação ao seu objetivo.",
    },
    {
      id: "q3",
      question: "Qual seu prazo realista pra atingir esse objetivo?",
      why: "Permite distribuir o plano dentro do tempo real disponível.",
    },
    {
      id: "q4",
      question:
        "Você prefere aprender por aulas em vídeo, textos, exercícios práticos ou uma combinação? Por quê?",
      why: "Indica o formato de conteúdo que costuma engajar mais.",
    },
  ];

  return { questions: base };
}

// ──────────────── Plano stub ────────────────

export function stubPlano(
  input: OnboardingInput,
  answers: DiagnosticoAnswer[],
  catalog: CatalogItem[]
): {
  summary: string;
  estimatedTotalMinutes: number;
  steps: Array<{
    order: number;
    title: string;
    description: string;
    type: "course" | "track" | "concept";
    courseId: number | null;
    trackId: number | null;
    estimatedMinutes: number;
  }>;
} {
  const timeMap: Record<OnboardingInput["timePerDay"], number> = {
    "10min": 10,
    "30min": 30,
    "60min": 60,
    "120min": 120,
  };
  const dailyMinutes = timeMap[input.timePerDay];

  // Pega até 4 itens do catálogo (prioriza cursos sobre trilhas)
  const courses = catalog.filter((c) => c.type === "course").slice(0, 3);
  const tracks = catalog.filter((c) => c.type === "track").slice(0, 1);
  const picks = [...courses, ...tracks];

  const steps: ReturnType<typeof stubPlano>["steps"] = [];

  // Etapa 1: orientação inicial (conceito)
  steps.push({
    order: 1,
    title: "Mapear o que você precisa aprender",
    description: `Releia o objetivo declarado ("${truncate(input.objective, 80)}") e liste os 3 a 5 sub-temas principais que você precisa dominar. Use suas respostas do diagnóstico como ponto de partida.`,
    type: "concept",
    courseId: null,
    trackId: null,
    estimatedMinutes: dailyMinutes,
  });

  // Etapas 2-N: itens reais do catálogo CEFIS
  picks.forEach((item, idx) => {
    const dur = item.duration ? Math.round(item.duration / 60) : dailyMinutes;
    steps.push({
      order: idx + 2,
      title: item.title,
      description:
        item.description ??
        `Conteúdo do catálogo CEFIS relacionado ao tema do seu objetivo.`,
      type: item.type,
      courseId: item.type === "course" ? item.id : null,
      trackId: item.type === "track" ? item.id : null,
      estimatedMinutes: dur,
    });
  });

  // Etapa final: aplicação prática (conceito)
  steps.push({
    order: steps.length + 1,
    title: "Aplicar o que aprendeu",
    description: `Reserve uma sessão pra colocar em prática o conteúdo: resolver um exercício real, escrever um resumo do que aprendeu, ou explicar pra outra pessoa.`,
    type: "concept",
    courseId: null,
    trackId: null,
    estimatedMinutes: dailyMinutes,
  });

  const totalMinutes = steps.reduce((acc, s) => acc + s.estimatedMinutes, 0);

  const sumPicks = picks.length > 0
    ? `Combina ${picks.length} ${picks.length === 1 ? "item" : "itens"} reais do catálogo CEFIS com etapas conceituais de preparação e prática.`
    : `Plano em modo simplificado: o catálogo CEFIS não retornou itens diretamente relacionados ao termo de busca. Você pode refinar o objetivo e regerar.`;

  return {
    summary: `Plano gerado em modo limitado (sem LLM ativo). ${sumPicks} Distribuído pra ${input.timePerDay.replace("min", " minutos")} por dia${answers.length > 0 ? `, considerando suas ${answers.length} respostas do diagnóstico` : ""}.`,
    estimatedTotalMinutes: totalMinutes,
    steps,
  };
}

// ──────────────── Tutor stub ────────────────

type StubTutorReference =
  | { type: "course" | "track"; id: number; title: string }
  | {
      type: "lesson";
      id: number;
      title: string;
      courseId: number;
      timestamp: string;
    };

export function stubTutor(
  question: string,
  catalog: CatalogItem[],
  excerpts: TutorExcerpt[] = []
): {
  answer: string;
  references: StubTutorReference[];
} {
  // Caso 1: temos excerpts reais de aula — resposta grounded em transcrição
  if (excerpts.length > 0) {
    const lines = excerpts
      .slice(0, 3)
      .map(
        (e, i) =>
          `${i + 1}. "${truncate(e.text, 180)}"\n   — aula "${e.lessonTitle}" do curso "${e.courseTitle}", aos ${e.timestamp}`
      )
      .join("\n\n");

    const refs: StubTutorReference[] = excerpts.slice(0, 3).map((e) => ({
      type: "lesson" as const,
      id: e.lessonId,
      title: e.lessonTitle,
      courseId: e.courseId,
      timestamp: e.timestamp,
    }));

    return {
      answer: `Modo limitado (sem LLM ativo). Encontrei trechos reais de aulas da CEFIS que tratam da sua pergunta:\n\n${lines}\n\nEsses trechos foram extraídos das legendas oficiais. Quando o tutor com IA estiver ativo, monto uma resposta mais elaborada usando o mesmo conteúdo como base.`,
      references: refs,
    };
  }

  // Caso 2: sem excerpts mas com catálogo — listar cursos relacionados
  const top = catalog.slice(0, 3);
  if (top.length === 0) {
    return {
      answer: `Estou em modo limitado (sem LLM ativo) e não encontrei conteúdo no catálogo da CEFIS diretamente relacionado a "${truncate(question, 120)}". Tente reformular a pergunta com palavras-chave mais específicas, ou volte mais tarde quando o tutor com IA estiver disponível.`,
      references: [],
    };
  }

  const refsList = top.map((r, i) => `${i + 1}. ${r.title}`).join("\n");

  return {
    answer: `Modo limitado: ainda sem LLM ativo pra gerar uma resposta completa. Encontrei ${top.length} ${top.length === 1 ? "item" : "itens"} reais no catálogo da CEFIS relacionados à sua pergunta:\n\n${refsList}\n\nVocê pode começar por esses enquanto o tutor com IA é restabelecido.`,
    references: top.map((r) => ({
      type: r.type,
      id: r.id,
      title: r.title,
    })),
  };
}

// ──────────────── Modo "Tenho 10 minutos" stub ────────────────

export function stubModoDez(
  topic: string,
  excerpts: TutorExcerpt[]
): {
  title: string;
  summary: string;
  keyPoints: string[];
  closing: string;
  estimatedReadingMinutes: number;
} {
  if (excerpts.length === 0) {
    return {
      title: `10 minutos sobre ${truncate(topic, 50)}`,
      summary: `Modo limitado (sem LLM ativo). Não encontrei trechos de aula da CEFIS diretamente relacionados a "${truncate(topic, 100)}". Tente reformular o tópico com palavras-chave mais específicas ou explore o catálogo manualmente.`,
      keyPoints: [],
      closing:
        "Quando o tutor com IA estiver ativo, esta síntese é gerada automaticamente combinando os trechos reais com explicação contextualizada.",
      estimatedReadingMinutes: 2,
    };
  }

  // Resumo: combina os primeiros trechos de forma honesta
  const intro =
    `Modo limitado: ainda sem LLM pra gerar uma síntese natural. ` +
    `Mas encontrei ${excerpts.length} ${excerpts.length === 1 ? "trecho" : "trechos"} reais de ${countDistinctLessons(excerpts)} ${countDistinctLessons(excerpts) === 1 ? "aula" : "aulas"} da CEFIS sobre "${truncate(topic, 80)}".`;

  // Pontos-chave: cada um é um trecho real com prefixo de origem
  const keyPoints = excerpts.slice(0, 5).map((e) => {
    return `${truncate(e.text, 220)}  — "${e.lessonTitle}" (curso "${e.courseTitle}", ${e.timestamp})`;
  });

  const closing =
    `Esses trechos foram extraídos das legendas oficiais das aulas. Quando o tutor com IA estiver ativo, a síntese fica mais coesa e contextualizada. ` +
    `Próximo passo: assistir as aulas referenciadas pra aprofundar.`;

  // Estimativa: ~150 palavras por minuto · cada excerpt ~30-50 palavras
  const wordCount = excerpts.reduce(
    (acc, e) => acc + e.text.split(/\s+/).length,
    intro.split(/\s+/).length + closing.split(/\s+/).length
  );
  const minutes = Math.max(2, Math.min(10, Math.round(wordCount / 150)));

  return {
    title: `10 minutos sobre ${truncate(topic, 50)}`,
    summary: intro,
    keyPoints,
    closing,
    estimatedReadingMinutes: minutes,
  };
}

function countDistinctLessons(excerpts: TutorExcerpt[]): number {
  const ids = new Set(excerpts.map((e) => e.lessonId));
  return ids.size;
}

// ──────────────── helpers ────────────────

function truncate(s: string, n: number): string {
  if (s.length <= n) return s;
  return s.slice(0, n - 1) + "…";
}
