/**
 * Prompts versionados pro CEFIS Adaptive Tutor.
 *
 * Princípios:
 * - Nunca inventar estatísticas / claims do catálogo CEFIS
 * - Quando referenciar curso, usar título exato vindo da API
 * - Tom: profissional, neutro, não infantilizado
 * - Idioma: pt-BR
 */

export type OnboardingInput = {
  name: string;
  objective: string;
  level: "iniciante" | "intermediario" | "avancado";
  timePerDay: "10min" | "30min" | "60min" | "120min";
};

const LEVEL_LABEL: Record<OnboardingInput["level"], string> = {
  iniciante: "iniciante (pouco ou nenhum contato com o tema)",
  intermediario: "intermediário (já estudou o básico antes)",
  avancado: "avançado (domina o básico e quer aprofundar)",
};

const TIME_LABEL: Record<OnboardingInput["timePerDay"], string> = {
  "10min": "10 minutos por dia",
  "30min": "30 minutos por dia",
  "60min": "1 hora por dia",
  "120min": "2 horas ou mais por dia",
};

// ──────────────── Diagnóstico ────────────────

export function diagnosticoPrompt(input: OnboardingInput) {
  const system = `Você é um tutor de aprendizagem especialista da CEFIS, uma plataforma brasileira de educação profissional. Sua missão é diagnosticar lacunas de conhecimento de cada aluno antes de montar um plano de estudos.

Regras:
- Gere de 3 a 5 perguntas curtas, objetivas, em português.
- Cada pergunta deve ajudar a entender o que o aluno já sabe e o que ainda precisa aprender pra atingir o objetivo declarado.
- Adapte a profundidade ao nível declarado: iniciante recebe perguntas conceituais; avançado recebe perguntas de aplicação prática.
- Não invente fatos. Não cite cursos específicos da CEFIS (você não sabe o catálogo neste momento).
- Cada pergunta deve vir com um campo "why" explicando ao aluno por que ela é útil pro plano (1 frase).

Saída obrigatória: JSON no formato:
{
  "questions": [
    { "id": "q1", "question": "...", "why": "..." },
    ...
  ]
}`;

  const user = `Aluno: ${input.name}
Objetivo declarado: "${input.objective}"
Nível atual: ${LEVEL_LABEL[input.level]}
Tempo disponível: ${TIME_LABEL[input.timePerDay]}

Gere as 3 a 5 perguntas de diagnóstico.`;

  return { system, user };
}

// ──────────────── Plano de estudos ────────────────

export type CatalogItem = {
  type: "course" | "track";
  id: number;
  title: string;
  description?: string | null;
  duration?: number; // segundos
  categories?: number[];
};

export type DiagnosticoAnswer = {
  questionId: string;
  question: string;
  answer: string;
};

export function planoPrompt(
  input: OnboardingInput,
  answers: DiagnosticoAnswer[],
  catalog: CatalogItem[]
) {
  const system = `Você é um tutor de aprendizagem especialista da CEFIS. Sua missão é montar um plano de estudos personalizado combinando trilhas e cursos REAIS do catálogo fornecido com etapas conceituais quando necessário.

Regras absolutas:
- USE APENAS itens (cursos/trilhas) que aparecem no catálogo fornecido. Refira-se a eles pelo "id" e "title" exatos.
- NÃO invente cursos, trilhas, professores, durações, números ou estatísticas.
- O plano deve ser realista para o tempo diário declarado.
- Entre 3 e 7 etapas. Cada etapa tem: ordem, título da etapa, descrição curta, tipo (course/track/concept), e quando aplicável courseId ou trackId do catálogo.
- Se nenhum item do catálogo se encaixa numa etapa, use type "concept" e descreva o que estudar — sem citar curso específico.
- Idioma: pt-BR. Tom: profissional, direto.

Saída obrigatória: JSON no formato:
{
  "summary": "1-2 frases descrevendo o plano",
  "estimatedTotalMinutes": <int>,
  "steps": [
    {
      "order": 1,
      "title": "...",
      "description": "...",
      "type": "course" | "track" | "concept",
      "courseId": <int|null>,
      "trackId": <int|null>,
      "estimatedMinutes": <int>
    }
  ]
}`;

  const catalogText = catalog
    .map((c) => {
      const dur = c.duration
        ? ` (~${Math.round(c.duration / 60)} min)`
        : "";
      const cats = c.categories?.length
        ? ` [cat: ${c.categories.join(",")}]`
        : "";
      return `- [${c.type}:${c.id}] "${c.title}"${dur}${cats}${c.description ? ` — ${c.description.slice(0, 120)}` : ""}`;
    })
    .join("\n");

  const answersText = answers
    .map(
      (a, i) =>
        `Q${i + 1}: ${a.question}\nResposta: ${a.answer}`
    )
    .join("\n\n");

  const user = `Aluno: ${input.name}
Objetivo: "${input.objective}"
Nível: ${LEVEL_LABEL[input.level]}
Tempo disponível: ${TIME_LABEL[input.timePerDay]}

═══ Respostas do diagnóstico ═══
${answersText || "(sem respostas registradas — gere plano genérico baseado em objetivo+nível)"}

═══ Catálogo disponível (use só estes IDs) ═══
${catalogText || "(catálogo vazio — gere plano só com etapas tipo concept)"}

Monte o plano de estudos.`;

  return { system, user };
}
