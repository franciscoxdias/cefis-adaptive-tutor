# CEFIS Adaptive Tutor

Tutor de aprendizagem com IA construído para o **CEFIS Hackathon de Inovação em Aprendizado** (26 de maio de 2026).

Combina o conteúdo real da CEFIS (catálogo, trilhas e transcrições) com IA para entregar onboarding, diagnóstico de lacunas, plano de estudos personalizado e tutoria contextual ao aluno.

---

## Stack

- **Framework:** Next.js (App Router) + React + TypeScript
- **Estilização:** Tailwind CSS
- **Hospedagem:** Vercel
- **Integração:** API REST CEFIS (`cefis.com.br` v1 e `api-v3.cefis.com.br` v3) via API routes server-side

## Estrutura

```
app/
  ├── layout.tsx              # Layout raiz (PT-BR, mobile-first)
  ├── page.tsx                # Página inicial
  ├── globals.css             # Estilos globais (Tailwind 4)
  └── api/
      └── cefis/
          └── health/         # Endpoint de saúde
```

## Como rodar localmente

```bash
git clone <repo-url>
cd cefis-adaptive-tutor
npm install
cp .env.example .env.local   # preencher com chaves reais
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

Ver `.env.example` para a lista completa. A API Key da CEFIS é obtida criando uma conta gratuita em [cefis.com.br](https://cefis.com.br) e usando `POST /api/v1/login`.

**Nunca commitar chaves reais.**

## Segurança e conteúdo proprietário

- API Keys ficam em `.env.local` (gitignored) ou nas env vars do Vercel.
- O arquivo de transcrições disponibilizado pela organização é tratado como conteúdo proprietário: processado server-side e não committado ao repositório.
- Embeddings e índices derivados também ficam fora do repositório.

## Status atual

Em construção durante o evento. Versão pública será publicada até as 23:59 (horário de Orlando) de 26/05/2026.

## Equipe

- **Francisco Dias** — Decisor e apresentador
- **Pedro Dias** — Operação assistida por AI presencial
- **Trinity (Claude)** — CEO AI / orquestração técnica
- **Manus AI** — Conselheiro analítico paralelo
