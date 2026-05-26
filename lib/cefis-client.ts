/**
 * Cliente server-side pra API CEFIS.
 *
 * Resolve 3 problemas:
 * 1. CORS — chamadas saem do servidor Next.js, não do browser
 * 2. Auth header diferente entre v1 (sem prefixo) e v3 (Bearer)
 * 3. Esconde a API Key do código frontend
 *
 * A key vem de process.env.CEFIS_API_KEY (gitignored).
 * Em dev: .env.local · em prod: env var do Vercel.
 */

const CEFIS_V1_BASE = "https://cefis.com.br";
const CEFIS_V3_BASE = "https://api-v3.cefis.com.br";

type ApiVersion = "v1" | "v3";

type FetchOptions = {
  version: ApiVersion;
  path: string; // ex: "/api/v1/user/me" pra v1, "/courses" pra v3
  query?: Record<string, string | number | boolean | undefined>;
  cache?: RequestCache;
  revalidate?: number; // segundos
};

function getKey(): string {
  const key = process.env.CEFIS_API_KEY;
  if (!key || key.trim().length === 0) {
    throw new Error(
      "CEFIS_API_KEY não configurada. Defina em .env.local (dev) ou env vars do Vercel (prod)."
    );
  }
  return key.trim();
}

function buildUrl(version: ApiVersion, path: string, query?: FetchOptions["query"]): string {
  const base = version === "v1" ? CEFIS_V1_BASE : CEFIS_V3_BASE;
  const url = new URL(base + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.append(k, String(v));
    }
  }
  return url.toString();
}

function buildHeaders(version: ApiVersion): HeadersInit {
  const key = getKey();
  return {
    Authorization: version === "v3" ? `Bearer ${key}` : key,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

/**
 * Faz GET na API CEFIS. Throw em status != 2xx.
 */
export async function cefisFetch<T>(options: FetchOptions): Promise<T> {
  const { version, path, query, cache, revalidate } = options;
  const url = buildUrl(version, path, query);

  const init: RequestInit & { next?: { revalidate: number } } = {
    method: "GET",
    headers: buildHeaders(version),
  };

  if (revalidate !== undefined) {
    init.next = { revalidate };
  } else if (cache) {
    init.cache = cache;
  } else {
    // Default: cache de 60s server-side pra reduzir hits e respeitar rate limit
    init.next = { revalidate: 60 };
  }

  const res = await fetch(url, init);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `CEFIS ${version} ${path} → HTTP ${res.status} ${res.statusText}: ${body.slice(0, 300)}`
    );
  }

  return (await res.json()) as T;
}
