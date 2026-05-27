/**
 * Prompts versionados pro CEFIS Adaptive Tutor.
 *
 * Princípios:
 * - Nunca inventar estatísticas / claims do catálogo CEFIS
 * - Quando referenciar curso, usar título exato vindo da API
 * - Tom: profissional, neutro, não infantilizado
 * - Idioma: pt-BR
 */

export type LearningStyle =
  | "visual"
  | "auditivo"
  | "leitura"
  | "pratico"
  | "misto";

export type Experience =
  | "comecando"
  | "1-3"
  | "4-7"
  | "8+"
  | "lideranca";

export type OnboardingInput = {
  name: string;
  objective: string;
  level: "iniciante" | "intermediario" | "avancado";
  timePerDay: "10min" | "30min" | "60min" | "120min";
  // Campos novos (opcionais pra retrocompat com perfis salvos antes da v9)
  area?: string; // ex: "Analista", "Gestor", "Contador", "Outro"
  experience?: Experience;
  learningStyle?: LearningStyle;
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
  "120min": "plano intensivo (2h+/dia)",
};

const EXPERIENCE_LABEL: Record<Experience, string> = {
  comecando: "começando agora",
  "1-3": "1 a 3 anos de experiência",
  "4-7": "4 a 7 anos de experiência",
  "8+": "8+ anos de experiência",
  lideranca: "experiência avançada / liderança",
};

const STYLE_LABEL: Record<LearningStyle, string> = {
  visual: "visual (vídeos, mapas, cards)",
  auditivo: "auditivo (áudio, podcast, narração)",
  leitura: "leitura (resumos, apostilas, guias escritos)",
  pratico: "prático/cinestésico (checklists, exercícios, tarefas)",
  misto: "misto (combinação dos formatos)",
};

function profileLines(input: OnboardingInput): string {
  const lines: string[] = [
    `Aluno: ${input.name}`,
    `Objetivo: "${input.objective}"`,
    `Nível: ${LEVEL_LABEL[input.level]}`,
    `Tempo disponível: ${TIME_LABEL[input.timePerDay]}`,
  ];
  if (input.area) lines.push(`Área/cargo: ${input.area}`);
  if (input.experience)
    lines.push(`Experiência profissional: ${EXPERIENCE_LABEL[input.experience]}`);
  if (input.learningStyle)
    lines.push(`Estilo de aprendizagem preferido: ${STYLE_LABEL[input.learningStyle]}`);
  return lines.join("\n");
}

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

  const user = `═══ Perfil do aluno ═══
${profileLines(input)}

Considere TODOS os campos acima — especialmente experiência profissional, área/cargo e estilo de aprendizagem — pra calibrar a profundidade e a forma das perguntas. Gere as 3 a 5 perguntas de diagnóstico.`;

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
  const system = `Você é um tutor de aprendizagem especialista da CEFIS. Sua missão é montar um plano de estudos personalizado combinando trilhas e cursos REAIS do catálogo fornecido com etapas conceituais quando necessário, adaptando ao perfil do aluno.

Regras absolutas:
- USE APENAS itens (cursos/trilhas) que aparecem no catálogo fornecido. Refira-se a eles pelo "id" e "title" exatos.
- NÃO invente cursos, trilhas, professores, durações, números ou estatísticas.
- O plano deve ser realista para o tempo diário e o nível de experiência declarados.
- Entre 3 e 7 etapas. Cada etapa tem: ordem, título da etapa, descrição curta, tipo (course/track/concept), e quando aplicável courseId ou trackId do catálogo.
- Se nenhum item do catálogo se encaixa numa etapa, use type "concept" e descreva o que estudar.
- Idioma: pt-BR. Tom: profissional, direto.

Adapte o plano ao estilo de aprendizagem declarado (se houver):
- visual: priorize aulas em vídeo, mencione cards e mapas mentais
- auditivo: indique roteiro estilo podcast pra revisão
- leitura: priorize resumos, apostilas e materiais escritos
- prático: inclua checklists e exercícios aplicados
- misto: combine formatos

Saída obrigatória: JSON no formato:
{
  "summary": "1-2 frases descrevendo o plano, refletindo perfil/experiência/estilo",
  "profileSummary": "1 frase começando com 'Você informou ...' que reflete os dados do onboarding e justifica adaptações",
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
  ],
  "materials": [
    { "type": "resumo" | "podcast" | "checklist" | "quiz", "title": "...", "description": "..." }
  ],
  "routine": [
    { "day": "Dia 1", "action": "..." }
  ]
}

Regras pra materials:
- Gere 3-4 materiais textuais (resumo/apostila textual, roteiro estilo podcast, checklist prático, quiz de 3-5 perguntas).
- Adapte a ordem ao estilo de aprendizagem (visual: cards/mapa no resumo; auditivo: podcast em destaque; leitura: resumo profundo; prático: checklist + quiz em destaque).
- Nunca prometa PDF, áudio gerado, ou download. Tudo é textual no MVP.

Regras pra routine:
- 4 a 5 dias sugeridos com ações curtas, realistas pro tempo diário declarado.
- Não invente sistema de tracking. Esta é uma SUGESTÃO de rotina, não progresso real.`;

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

  const user = `═══ Perfil completo do aluno ═══
${profileLines(input)}

═══ Respostas do diagnóstico ═══
${answersText || "(sem respostas registradas — gere plano baseado no perfil)"}

═══ Catálogo CEFIS disponível (use só estes IDs) ═══
${catalogText || "(catálogo vazio — gere plano só com etapas tipo concept)"}

Monte o plano de estudos completo, incluindo materials e routine.`;

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
  const hasExcerpts = excerpts.length > 0;
  const system = `Você é um tutor da CEFIS especializado em sintetizar conteúdo para aprendizado rápido.

Sua tarefa: dado um tópico, montar uma síntese de leitura em ~10 minutos.

Regras absolutas:
- Nunca invente cursos, aulas, professores, datas ou estatísticas da CEFIS.
- Nunca invente URLs de fontes externas.

Dois cenários possíveis, decididos APENAS pela presença de trechos reais:

CENÁRIO A — há ≥1 trecho REAL de aula CEFIS fornecido (excerpts != []):
- Use os trechos como evidência PRIMÁRIA.
- Sumário e pontos-chave devem referenciar o que está nos trechos.
- Mencione naturalmente os nomes das aulas/cursos quando relevante.
- Os campos extras (objective, explanation, etc) ficam OPCIONAIS neste cenário.

CENÁRIO B — nenhum trecho CEFIS fornecido (excerpts == []):
INDEPENDENTEMENTE de haver cursos relacionados no catálogo. Se não há
trechos extraídos das transcrições, considere SEM cobertura direta.

- title: comece SEMPRE com "Aula complementar personalizada gerada por IA: " seguido do tópico
- summary: comece SEMPRE com "Não encontrei cobertura direta no catálogo CEFIS para este tópico. Este conteúdo é complementar e não substitui uma aula oficial da CEFIS." seguido de 1-2 parágrafos introdutórios
- Preencha OBRIGATORIAMENTE os 7 campos da aula complementar estruturada:
  * objective: 1 frase com o objetivo de aprendizagem
  * explanation: 2-3 parágrafos com explicação estruturada do tema
  * keyPoints: 4-6 pontos-chave em formato lista
  * practicalExample: 1 parágrafo com exemplo concreto/aplicado
  * exercise: 2-4 itens de checklist ou pergunta de fixação (array de strings)
  * recommendedSources: 2-4 fontes amplamente reconhecidas para validação independente (sem URLs inventadas). Use nomes genéricos como "Livros didáticos clássicos sobre [tópico]", "Wikipedia em pt-BR", "Khan Academy", "Coursera", "MOOCs universitários", "publicações acadêmicas". Cada item: { title, type, note? }
  * advisory: aviso explícito de que é material complementar gerado por IA, não aula oficial CEFIS
- closing: sugira ao aluno explorar o catálogo CEFIS por temas relacionados quando disponíveis

Cenário atual: ${hasExcerpts ? "A (há trechos reais — use como evidência primária)" : "B (SEM trechos — gere os 7 campos da aula complementar estruturada)"}.

Linguagem: pt-BR, profissional, direto. Síntese objetiva, fácil de ler em ~5-10 minutos.

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
  const hasGrounding = excerpts.length > 0 || catalog.length > 0;

  const system = `Você é um tutor de aprendizagem da CEFIS. Sua função é responder dúvidas do aluno priorizando conteúdo real do catálogo CEFIS sempre que disponível.

Regras absolutas:
- NUNCA invente cursos, professores, datas, números, estatísticas ou citações da CEFIS.
- Quando houver trechos de aula relevantes, use-os como evidência principal da resposta, mencionando o título da aula e o timestamp.
- Cite cursos/trilhas do catálogo pelo título exato e indique courseId/trackId.

Dois cenários possíveis:

CENÁRIO A — há trechos/catálogo CEFIS relacionados:
- Responda ANCORADO nos trechos. Cite aula e timestamp.
- Use type "lesson" + courseId + timestamp nas references.

CENÁRIO B — não há trechos relevantes da CEFIS:
- Comece a resposta exatamente com: "Não encontrei cobertura direta no catálogo CEFIS para este tópico. Segue um material complementar gerado por IA:"
- Em seguida, ofereça uma explicação útil sobre o tópico (você pode usar seu conhecimento geral).
- NÃO mencione courseId/trackId/lessonId inexistentes. references deve ser array vazio.
- Seja honesto sobre estar gerando material complementar, não conteúdo CEFIS.

Tom: profissional, direto, em pt-BR. Resposta concisa (até 250 palavras).

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
