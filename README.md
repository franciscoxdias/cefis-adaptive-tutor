# CEFIS Adaptive Tutor

> **Protótipo funcional de hackathon.** Arquitetura preparada para integração nativa na CEFIS.

Desenvolvido para o **CEFIS Hackathon de Inovação em Aprendizado** — 26 de maio de 2026, Orlando.

**Demo ao vivo:** https://cefis-adaptive-tutor.vercel.app/
**Repositório:** https://github.com/franciscoxdias/cefis-adaptive-tutor

---

## Como o produto é pensado

Em **produção**, esta experiência viveria dentro do ecossistema da CEFIS:

- Hospedada no domínio CEFIS
- Usando autenticação real do aluno (sessão / SSO CEFIS)
- Lendo perfil, progresso e certificados reais da conta logada
- Servindo como camada adaptativa em cima do catálogo já existente

No **hackathon**, demonstramos a mesma lógica como um app externo que se integra à CEFIS via API. Coletamos perfil, objetivo, nível e tempo disponível por um onboarding próprio e usamos uma API Key server-side para provar que a integração é viável e robusta.

A intenção é validar a **mecânica adaptativa**: dado um aluno e um catálogo real, montar diagnóstico, plano e tutoria ancorados em conteúdo real. A versão de produção pluga esse mecanismo no fluxo nativo do aluno CEFIS.

---

## O problema

Toda plataforma de educação tem o mesmo gargalo invisível: o aluno entra, vê o catálogo, e não sabe por onde começar. O conteúdo está lá — só falta uma camada que conecte o objetivo real do aluno ao conteúdo certo, no tempo certo.

## A proposta

Um motor de aprendizagem adaptativa que usa o conteúdo real da CEFIS (catálogo + trilhas + transcrições oficiais das aulas) para entregar:

1. **Onboarding** rápido (nome, objetivo, nível, tempo disponível).
   *MVP: form próprio. Produção: viria do aluno logado na CEFIS.*

2. **Diagnóstico de lacunas** via 3-5 perguntas geradas a partir do objetivo.
   *MVP: perguntas adaptativas. Produção: somar `/performance/certificates` e histórico de progresso pra comparar estado atual vs desejado.*

3. **Plano de estudos** combinando trilhas e cursos reais do catálogo com etapas conceituais. Quando o catálogo não cobre um tema (ex: alguém pede "10 minutos sobre astronomia"), o sistema **não inventa cursos da CEFIS** — sinaliza honestamente e oferece material gerado pela IA.

4. **Tutor contextual** que responde dúvidas citando curso, aula e timestamp real, extraídos das legendas oficiais (WebVTT).

5. **Modo "Tenho 10 minutos"** que extrai trechos de várias aulas reais e monta uma síntese curta — direto do briefing da organização.

Cada resposta é ancorada em conteúdo real. O sistema é honesto sobre o que sabe e o que não sabe.

---

## Fluxo do produto

```
Home /
  │
  ├─→ Jornada completa
  │      Onboarding → Diagnóstico → Plano → Tutor
  │
  └─→ Modo expresso
         Tenho 10 minutos
```

---

## Integração CEFIS

8 endpoints proxy server-side em `app/api/cefis/`, todos respeitando autenticação por API Key (não exposta ao cliente).

| Endpoint do proxy | Endpoint CEFIS chamado |
|---|---|
| `GET /api/cefis/health` | (saúde do app) |
| `GET /api/cefis/me` | `GET /api/v1/user/me` (CEFIS v1) |
| `GET /api/cefis/courses` | `GET /courses` (CEFIS v3) |
| `GET /api/cefis/courses/[id]/lessons` | `GET /courses/:id/lessons` (CEFIS v3) |
| `GET /api/cefis/subtitles/[lessonId]` | `GET /lessons/:id/subtitles` (CEFIS v3) |
| `GET /api/cefis/subtitles/[lessonId]?text=true` | + download WebVTT do S3 público + parse |
| `GET /api/cefis/subtitles/[lessonId]?text=true&q=keyword` | + busca textual nos segmentos |
| `GET /api/cefis/tracks` | `GET /tracks` (CEFIS v3) |

### Pipeline de transcrições (VTT)

A CEFIS expõe metadados das legendas via `/lessons/:id/subtitles`. Cada metadado contém a URL pública do arquivo WebVTT no S3, com timestamps reais por segmento. Aproveitamos isso para:

1. Dada uma pergunta ou tópico, buscar cursos relevantes (`/courses?search=…` com fallback progressivo de keywords)
2. Para cada curso top: buscar aulas (`/courses/:id/lessons`)
3. Para cada aula top: baixar e parsear o WebVTT
4. Fazer busca textual scoring nos segmentos
5. Selecionar top excerpts e usar como contexto pra resposta (IA generativa OU determinística)

Resultado: respostas que citam **"curso X · aula Y · 0:33"** com base em transcrição literal da CEFIS.

---

## Endpoints internos de IA

Quatro endpoints implementam a camada adaptativa, todos com fallback determinístico que **não inventa**:

| Endpoint | Função |
|---|---|
| `POST /api/diagnostico/generate` | Gera 3-5 perguntas adaptadas ao objetivo e nível |
| `POST /api/plano/generate` | Combina catálogo CEFIS real + perfil para montar plano |
| `POST /api/tutor/ask` | Responde dúvidas com grounding em trechos VTT reais |
| `POST /api/modo-10min/generate` | Extrai trechos de várias aulas e monta síntese rápida |

---

## Adapter de LLM (provider-agnóstico)

`lib/llm-client.ts` é um cliente neutro que suporta OpenAI ou Anthropic via fetch direto. Detecta o provider via `LLM_PROVIDER` ou pela presença de `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` no ambiente.

Cada endpoint de IA segue o padrão:

```
1. Buscar dados reais da CEFIS (catálogo + transcrições relevantes)
2. Montar prompt com regras anti-alucinação (use SÓ os IDs/trechos fornecidos)
3. Tentar gerar resposta via LLM
4. Se LLM provider não estiver ativo OU falhar:
   → Cair pra função determinística em lib/stub-responses.ts
   → A função usa os MESMOS dados reais já buscados para montar resposta plausível
5. Response sempre inclui source: "llm" | "stub" + métricas
```

Isso garante que:
- **Sempre temos resposta**, mesmo sem LLM provider ativo
- A resposta **nunca inventa** — usa só dado real da CEFIS
- O usuário vê a badge "Ancorada em aulas reais" indicando grounding real

**No momento da entrega deste protótipo**, o LLM provider externo não está ativo. As respostas são geradas pelo fallback determinístico usando trechos reais das transcrições da CEFIS. A adoção de OpenAI ou Anthropic é uma variável de ambiente — sem mudança de código.

---

## Arquitetura

```
Browser (mobile-first, responsivo desktop)
   │
   ▼
Next.js App Router @ Vercel
   ├── Páginas (5): / · /onboarding · /diagnostico · /plano · /tutor · /modo-10min
   │
   ├── API routes server-side (8):
   │     /api/cefis/* + /api/{diagnostico,plano,tutor,modo-10min}/...
   │
   └── lib/
         ├── cefis-client.ts     (proxy v1+v3, cache server-side)
         ├── llm-client.ts       (OpenAI + Anthropic, auto-detect)
         ├── prompts.ts          (versionados, pt-BR, anti-alucinação)
         ├── stub-responses.ts   (fallback determinístico grounded)
         ├── subtitles-fetcher.ts (metadata CEFIS + VTT do S3 + cache)
         ├── vtt-parser.ts       (WebVTT → segments + searchSegments)
         ├── types.ts            (tipos baseados na doc oficial CEFIS)
         └── format.ts           (humanizeMinutes + paceEstimate)
```

---

## Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **Estilização:** Tailwind CSS 4 (paleta brand navy `#0a2540` + accent emerald)
- **Hospedagem:** Vercel (deploy contínuo via push no `main`)
- **Sem SDK pesado:** fetch nativo pro CEFIS e pro LLM (bundle leve)
- **Sem banco:** estado client-side em `localStorage` (suficiente pra demo)
- **Sem framework de RAG:** busca textual com scoring simples + segmentação WebVTT

---

## Como rodar localmente

```bash
git clone git@github.com:franciscoxdias/cefis-adaptive-tutor.git
cd cefis-adaptive-tutor
npm install
cp .env.example .env.local   # preencher com chaves reais
npm run dev
```

Abra http://localhost:3000.

### Variáveis de ambiente

Ver `.env.example`. Mínimo necessário:

```
CEFIS_API_KEY=    # obter em cefis.com.br (conta gratuita) via POST /api/v1/login
```

Opcionais (se ativar IA generativa):

```
OPENAI_API_KEY=...
# ou
ANTHROPIC_API_KEY=...
```

**Nunca commite chaves reais.** `.gitignore` já cobre `.env*` exceto o `.env.example`.

---

## Segurança e conteúdo proprietário

- API Keys ficam em `.env.local` (gitignored) ou em env vars do Vercel
- Arquivo `.gitignore` cobre: `.env*`, `*.zip`, `/transcripts/`, `/embeddings/`, `/data/`, formatos comuns de vetor (`.parquet`, `.pkl`, `.npy`, `.faiss`, `.index`, `.bin`)
- Transcrições são consumidas sob demanda pelo servidor a partir do S3 público da CEFIS — nada é commitado no repo
- Deploy key SSH dedicada pro repo (não usa identidade pessoal do mantenedor)
- Endpoint `/api/cefis/me` filtra PII (email, CPF, birthdate) antes de devolver ao cliente

---

## Diferenciais demonstrados no MVP

- Interface mobile-first e responsiva pra desktop
- Integração real com catálogo, trilhas, aulas e transcrições da CEFIS
- Tutor com respostas ancoradas em material real (curso + aula + timestamp)
- Modo **"Tenho 10 minutos"** direto do briefing da organização
- Timestamps reais extraídos das legendas oficiais (WebVTT)
- Arquitetura provider-agnóstica pronta pra LLM real
- Fallback determinístico honesto que **não alucina**
- Cobertura honesta do catálogo: quando o tema não existe, não fingimos
- Stub e LLM convivem com a mesma interface

---

## Limitações honestas

Este é um **protótipo funcional de hackathon**, construído em um dia. Não é um produto pronto pra produção.

- **LLM provider:** no momento da entrega, sem provider externo ativo. A arquitetura está pronta — adicionar `OPENAI_API_KEY` ou `ANTHROPIC_API_KEY` em env var ativa o modo IA generativa. Em modo determinístico, as respostas continuam sendo ancoradas em conteúdo real (badge "Ancorada em aulas reais").
- **Autenticação:** MVP usa onboarding próprio + API Key server-side. Produção real usaria sessão / SSO CEFIS do aluno logado.
- **Diagnóstico:** MVP gera perguntas adaptativas a partir do objetivo declarado. Produção usaria também `/performance/certificates` e histórico de progresso real do aluno.
- **Rate limit CEFIS:** valores exatos não documentados. Mitigamos com cache server-side de 5-10min em todos os proxies.
- **CORS:** todas as chamadas passam por API route server-side; nenhuma chave aparece no browser.
- **Persistência:** `localStorage` no cliente. Suficiente pra demo, não pra produção multi-usuário.
- **Cobertura do catálogo:** quando o aluno pede tema fora do catálogo, o sistema informa honestamente em vez de fingir cobertura.
- **Categorias CEFIS:** API retorna IDs 1-7 sem nome legível; o protótipo trabalha com IDs.
- **Idiomas:** pt-BR. Estrutura preparada pra i18n mas não implementada.

---

## Roadmap pós-hackathon

Visão de produção como **feature nativa da CEFIS**, se a parceria avançar:

### Integração nativa
1. **Hospedagem dentro do domínio CEFIS** com SSO / sessão do aluno
2. **Autenticação real** (sem onboarding próprio) — perfil vem direto do `/user/me`
3. **Diagnóstico baseado em histórico** real — combina `/performance/certificates`, progresso de aulas, áreas declaradas no perfil
4. **Persistência** por usuário com Supabase ou similar — aluno retoma de onde parou

### Capacidades de aprendizagem
5. **Estilo de aprendizagem** (visual / auditivo / cinestésico) — adapta formato de saída
6. **Geração própria** de apostilas, resumos, questionários quando catálogo não cobre
7. **Áudio / podcast** — TTS pras sínteses do modo 10min
8. **Acompanhamento diário** — rotina + nudges + revisão espaçada
9. **Avaliação contínua** — quiz adaptativo entre aulas

### Infraestrutura
10. **Indexação semântica** — embeddings das transcrições pra busca por significado
11. **Streaming** — tutor responde token-a-token
12. **Multi-idioma** — i18n pt-BR + en + es
13. **Mobile nativo** — wrapper React Native consumindo as mesmas API routes
14. **Analytics** — métricas reais de engajamento e conclusão por trilha personalizada

---

## Equipe

- **Francisco Dias** — Estratégia, decisões e apresentação
- **Pedro Dias** — Operação assistida por AI presencial (Manus AI)
- **Trinity (Claude)** — CEO AI / orquestração técnica e construção
- **Manus AI** — Conselheiro analítico paralelo

Construído em ~6 horas no dia do evento, com commits incrementais públicos no `main`.
