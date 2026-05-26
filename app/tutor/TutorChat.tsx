"use client";

import { useEffect, useRef, useState } from "react";

type Reference = { type: "course" | "track"; id: number; title: string };

type Message = {
  role: "user" | "assistant";
  content: string;
  references?: Reference[];
  source?: "llm" | "stub";
};

const HISTORY_KEY = "cefis-tutor:tutor-history";

export default function TutorChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Restaurar histórico do localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setMessages(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Persistir histórico
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-20)));
    } catch {
      // ignore
    }
  }, [messages]);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;

    setError(null);
    const userMsg: Message = { role: "user", content: q };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/tutor/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          history: next.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message ?? `HTTP ${res.status}`);
      }

      const assistant: Message = {
        role: "assistant",
        content: data.answer ?? "(sem resposta)",
        references: data.references ?? [],
        source: data.source,
      };

      setMessages((prev) => [...prev, assistant]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na requisição");
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {messages.length === 0 && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Pergunte qualquer coisa sobre o seu objetivo de estudos. O tutor
            consulta o catálogo da CEFIS e responde citando o conteúdo real
            quando disponível.
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            Exemplos: &quot;por onde começar a estudar X?&quot;, &quot;qual a
            diferença entre Y e Z?&quot;, &quot;me indica o caminho mais curto
            pra aprender W&quot;.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-2 sticky bottom-2">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit(e);
              }
            }}
            rows={2}
            maxLength={500}
            placeholder="Pergunte algo..."
            disabled={loading}
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition focus:border-zinc-900 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100 resize-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shrink-0"
          >
            Enviar
          </button>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={clearHistory}
            className="text-xs text-zinc-400 hover:text-zinc-600 self-end dark:hover:text-zinc-300"
          >
            limpar conversa
          </button>
        )}
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
            : "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {message.content}
        </p>
        {!isUser && message.references && message.references.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-300 dark:border-zinc-700">
            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1.5">
              Conteúdo CEFIS citado:
            </p>
            <ul className="flex flex-col gap-1">
              {message.references.map((ref, i) => (
                <li
                  key={`${ref.type}-${ref.id}-${i}`}
                  className="text-xs text-zinc-700 dark:text-zinc-300"
                >
                  <span className="opacity-60 mr-1">
                    [{ref.type === "course" ? "curso" : "trilha"} #{ref.id}]
                  </span>
                  {ref.title}
                </li>
              ))}
            </ul>
          </div>
        )}
        {!isUser && message.source === "stub" && (
          <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-2 italic">
            modo limitado (sem LLM ativo)
          </p>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl px-4 py-3">
        <div className="flex gap-1.5 items-center">
          <span className="h-2 w-2 rounded-full bg-zinc-400 animate-pulse" />
          <span className="h-2 w-2 rounded-full bg-zinc-400 animate-pulse [animation-delay:0.2s]" />
          <span className="h-2 w-2 rounded-full bg-zinc-400 animate-pulse [animation-delay:0.4s]" />
        </div>
      </div>
    </div>
  );
}
