/**
 * Cliente LLM neutro server-side.
 *
 * Suporta:
 *  - OpenAI (api.openai.com/v1)
 *  - Anthropic (api.anthropic.com)
 *  - Groq (api.groq.com/openai/v1) — OpenAI-compatible
 *  - Qualquer provider OpenAI-compatible via LLM_BASE_URL custom
 *
 * Auto-detecta provider via env vars na ordem:
 *  1. LLM_PROVIDER explícito (groq | openai | anthropic)
 *  2. GROQ_API_KEY presente
 *  3. OPENAI_API_KEY presente
 *  4. ANTHROPIC_API_KEY presente
 *
 * Sem SDK externo — fetch direto pra manter bundle leve.
 */

export type LLMProvider = "openai" | "anthropic" | "groq";

export type ChatMessage = {
  system: string;
  user: string;
};

export type ChatOptions = {
  temperature?: number;
  maxTokens?: number;
  provider?: LLMProvider;
  model?: string;
};

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  anthropic: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
  groq: process.env.LLM_MODEL ?? "llama-3.3-70b-versatile",
};

function detectProvider(override?: LLMProvider): LLMProvider {
  if (override) return override;
  const explicit = process.env.LLM_PROVIDER?.toLowerCase();
  if (explicit === "openai" || explicit === "anthropic" || explicit === "groq") {
    return explicit;
  }

  // Auto-detect por presença de key
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";

  throw new Error(
    "Nenhuma LLM key configurada. Defina GROQ_API_KEY, OPENAI_API_KEY ou ANTHROPIC_API_KEY."
  );
}

// ──────────────── OpenAI-compatible (OpenAI + Groq) ────────────────

type OpenAICompatibleConfig = {
  apiKey: string;
  baseURL: string;
  model: string;
};

function getOpenAIConfig(): OpenAICompatibleConfig {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY ausente.");
  return {
    apiKey: key,
    baseURL: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
    model: DEFAULT_MODELS.openai,
  };
}

function getGroqConfig(): OpenAICompatibleConfig {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY ausente.");
  return {
    apiKey: key,
    baseURL: process.env.LLM_BASE_URL ?? "https://api.groq.com/openai/v1",
    model: DEFAULT_MODELS.groq,
  };
}

async function chatOpenAICompatible(
  config: OpenAICompatibleConfig,
  messages: ChatMessage,
  options: ChatOptions,
  jsonMode: boolean
): Promise<string> {
  const model = options.model ?? config.model;

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

  const res = await fetch(`${config.baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `LLM ${res.status} @ ${config.baseURL}: ${text.slice(0, 400)}`
    );
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("LLM: resposta sem content");
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
      "Content-Type": "application/json; charset=utf-8",
      Accept: "application/json",
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
  if (provider === "groq") {
    return chatOpenAICompatible(getGroqConfig(), messages, options, false);
  }
  if (provider === "openai") {
    return chatOpenAICompatible(getOpenAIConfig(), messages, options, false);
  }
  return chatAnthropic(messages, options);
}

/**
 * Pede ao LLM resposta em JSON. Tenta parsear. Throw se não for JSON válido.
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
  if (provider === "groq") {
    raw = await chatOpenAICompatible(getGroqConfig(), reinforced, options, true);
  } else if (provider === "openai") {
    raw = await chatOpenAICompatible(getOpenAIConfig(), reinforced, options, true);
  } else {
    raw = await chatAnthropic(reinforced, options);
  }

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
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  return text;
}

export function getActiveProvider(): LLMProvider {
  return detectProvider();
}
