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

// ──────────────── Tutor contextual ────────────────

export type TutorMessage = {
  role: "user" | "assistant";
  content: string;
};

export type TutorExcerpt = {
  courseId: number;
  courseTitle: string;
  lessonId: number;
  lessonTitle: string;
  timestamp: string; // "MM:SS"
  text: string;
};

// ──────────────── Modo "Tenho 10 minutos" ────────────────

export function modoDezPrompt(topic: string, excerpts: TutorExcerpt[]) {
  const system = `Você é um tutor da CEFIS especializado em sintetizar conteúdo para aprendizado rápido.

Sua tarefa: dado um tópico e até 8 trechos reais de aulas do catálogo CEFIS, montar uma síntese de 10 minutos de leitura sobre o tema.

Regras absolutas:
- Não invente fatos, dados, números ou estatísticas.
- Use SOMENTE os trechos fornecidos como evidência primária.
- Se os trechos não cobrem aspectos importantes do tópico, diga isso explicitamente.
- Linguagem: pt-BR, profissional, direto.
- A síntese deve ser objetiva, fácil de ler em ~5-10 minutos.

Saída obrigatória: JSON no formato:
{
  "title": "título curto do bloco de estudo (máx 60 caracteres)",
  "summary": "1-2 parágrafos abrindo o tema",
  "keyPoints": ["ponto chave 1", "ponto chave 2", ...],  // 3-5 itens
  "closing": "1 parágrafo de fechamento com sugestão de próximo passo",
  "estimatedReadingMinutes": <int>  // estimativa realista 5-10
}`;

  const excerptsText = excerpts
    .map(
      (e, i) =>
        `[${i + 1}] Curso "${e.courseTitle}" · Aula "${e.lessonTitle}" · ${e.timestamp}\n"${e.text}"`
    )
    .join("\n\n");

  const user = `Tópico do aluno: "${topic}"

═══ Trechos reais de aula (use como evidência primária) ═══
${excerptsText || "(nenhum trecho disponível — gerar síntese curta dizendo isso)"}

Monte a síntese de 10 minutos.`;

  return { system, user };
}

export function tutorPrompt(
  question: string,
  catalog: CatalogItem[],
  history: TutorMessage[] = [],
  excerpts: TutorExcerpt[] = []
) {
  const system = `Você é um tutor de aprendizagem da CEFIS. Sua função é responder dúvidas do aluno apoiando-se SEMPRE em conteúdo real do catálogo e dos trechos de aula fornecidos abaixo.

Regras absolutas:
- Não invente cursos, professores, datas, números, estatísticas ou citações.
- Quando houver trechos de aula relevantes, use-os como evidência principal da resposta, mencionando o título da aula e o timestamp.
- Cite cursos/trilhas do catálogo pelo título exato e indique courseId/trackId.
- Se nem catálogo nem trechos contêm conteúdo relevante, diga isso explicitamente e ofereça orientação genérica curta sem inventar.
- Tom: profissional, direto, em pt-BR. Resposta concisa (até 200 palavras).

Saída obrigatória: JSON no formato:
{
  "answer": "texto da resposta",
  "references": [
    { "type": "course" | "track" | "lesson", "id": <int>, "title": "...", "timestamp": "MM:SS"?, "courseId": <int>? }
  ]
}

- Use type "lesson" e inclua courseId+timestamp quando referenciar trecho de aula.
- Se não houver referências reais, devolva references como array vazio [].`;

  const catalogText = catalog
    .map((c) => {
      const dur = c.duration ? ` (~${Math.round(c.duration / 60)} min)` : "";
      return `- [${c.type}:${c.id}] "${c.title}"${dur}${c.description ? ` — ${c.description.slice(0, 120)}` : ""}`;
    })
    .join("\n");

  const excerptsText = excerpts
    .map(
      (e, i) =>
        `[${i + 1}] Curso "${e.courseTitle}" (course:${e.courseId}) · Aula "${e.lessonTitle}" (lesson:${e.lessonId}) · ${e.timestamp}\n"${e.text}"`
    )
    .join("\n\n");

  const historyText = history.length > 0
    ? "\n═══ Conversa anterior ═══\n" +
      history
        .slice(-6) // últimas 6 mensagens
        .map((m) => `${m.role === "user" ? "Aluno" : "Tutor"}: ${m.content}`)
        .join("\n") +
      "\n"
    : "";

  const user = `═══ Catálogo CEFIS disponível ═══
${catalogText || "(nenhum item retornado pra esta consulta)"}

═══ Trechos de aula reais (use como evidência principal) ═══
${excerptsText || "(nenhum trecho de aula disponível pra esta consulta)"}
${historyText}
═══ Pergunta atual ═══
${question}`;

  return { system, user };
}
