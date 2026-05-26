/**
 * Cliente LLM neutro server-side.
 *
 * Suporta OpenAI e Anthropic com a mesma interface. Detecta provider
 * via env vars (LLM_PROVIDER explícito, ou OPENAI_API_KEY/ANTHROPIC_API_KEY
 * implícito).
 *
 * Modos:
 *  - chat({ system, user }) → string
 *  - chatJson<T>({ system, user, schemaHint }) → T (resposta parseada como JSON)
 *
 * Sem SDK externo — usa fetch direto pra manter bundle leve.
 */

export type LLMProvider = "openai" | "anthropic";

export type ChatMessage = {
  system: string;
  user: string;
};

export type ChatOptions = {
  temperature?: number;
  maxTokens?: number;
  // Override do provider auto-detectado
  provider?: LLMProvider;
  // Override do model
  model?: string;
};

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  anthropic: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
};

function detectProvider(override?: LLMProvider): LLMProvider {
  if (override) return override;
  const explicit = process.env.LLM_PROVIDER?.toLowerCase();
  if (explicit === "openai" || explicit === "anthropic") return explicit;

  // Auto-detect por presença de key
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";

  throw new Error(
    "Nenhuma LLM key configurada. Defina OPENAI_API_KEY ou ANTHROPIC_API_KEY em .env.local."
  );
}

// ──────────────── OpenAI ────────────────

async function chatOpenAI(
  messages: ChatMessage,
  options: ChatOptions,
  jsonMode: boolean
): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY ausente.");

  const model = options.model ?? DEFAULT_MODELS.openai;

  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: messages.system },
      { role: "user", content: messages.user },
    ],
    temperature: options.temperature ?? 0.4,
    max_tokens: options.maxTokens ?? 1200,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 400)}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI: resposta sem content");
  }
  return content;
}

// ──────────────── Anthropic ────────────────

async function chatAnthropic(
  messages: ChatMessage,
  options: ChatOptions
): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY ausente.");

  const model = options.model ?? DEFAULT_MODELS.anthropic;

  const body = {
    model,
    max_tokens: options.maxTokens ?? 1200,
    temperature: options.temperature ?? 0.4,
    system: messages.system,
    messages: [{ role: "user", content: messages.user }],
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic ${res.status}: ${text.slice(0, 400)}`);
  }

  const json = await res.json();
  const block = json?.content?.[0];
  const text = block?.text;
  if (typeof text !== "string") {
    throw new Error("Anthropic: resposta sem text");
  }
  return text;
}

// ──────────────── Public API ────────────────

export async function chat(
  messages: ChatMessage,
  options: ChatOptions = {}
): Promise<string> {
  const provider = detectProvider(options.provider);
  if (provider === "openai") return chatOpenAI(messages, options, false);
  return chatAnthropic(messages, options);
}

/**
 * Pede ao LLM resposta em JSON. Tenta parsear. Throw se não for JSON válido.
 *
 * Pra OpenAI usa response_format json_object.
 * Pra Anthropic depende do system prompt instruir JSON-only.
 */
export async function chatJson<T = unknown>(
  messages: ChatMessage,
  options: ChatOptions = {}
): Promise<T> {
  const provider = detectProvider(options.provider);

  // Garante que o system prompt instrui JSON
  const reinforced: ChatMessage = {
    system:
      messages.system +
      "\n\nIMPORTANTE: responda APENAS com JSON válido, sem markdown, sem ```, sem texto antes ou depois.",
    user: messages.user,
  };

  let raw: string;
  if (provider === "openai") {
    raw = await chatOpenAI(reinforced, options, true);
  } else {
    raw = await chatAnthropic(reinforced, options);
  }

  // Fallback: extrair JSON se vier embrulhado em markdown
  const trimmed = raw.trim();
  const jsonText = extractJson(trimmed);

  try {
    return JSON.parse(jsonText) as T;
  } catch (err) {
    throw new Error(
      `LLM retornou JSON inválido: ${(err as Error).message}\nRaw: ${raw.slice(0, 300)}`
    );
  }
}

function extractJson(text: string): string {
  // Se vier ```json ... ``` extrai o miolo
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return text;
}

export function getActiveProvider(): LLMProvider {
  return detectProvider();
}
