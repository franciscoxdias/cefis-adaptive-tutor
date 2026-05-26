import { NextResponse } from "next/server";

/**
 * /api/cefis/health
 *
 * Endpoint de saúde do app. Ainda não chama a API CEFIS real.
 * Será expandido em Bloco 2 para validar a API Key e a conectividade
 * com cefis.com.br e api-v3.cefis.com.br.
 */
export async function GET() {
  const checkedAt = new Date().toISOString();

  return NextResponse.json({
    status: "ok",
    app: "cefis-adaptive-tutor",
    version: "0.1.0",
    checkedAt,
    cefisIntegration: "pending",
  });
}
