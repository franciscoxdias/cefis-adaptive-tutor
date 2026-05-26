import { NextResponse } from "next/server";
import { cefisFetch } from "@/lib/cefis-client";
import type { CefisUserResponse } from "@/lib/types";

/**
 * GET /api/cefis/me
 *
 * Proxy server-side para CEFIS GET /api/v1/user/me.
 * Retorna apenas campos não sensíveis pro frontend usar em personalização.
 */
export async function GET() {
  try {
    const result = await cefisFetch<CefisUserResponse>({
      version: "v1",
      path: "/api/v1/user/me",
      revalidate: 300, // 5min
    });

    const u = result.data;

    // Filtragem: NÃO expor email, CPF, birthdate, certified_name no frontend
    return NextResponse.json({
      id: u.id,
      firstName: u.first_name,
      name: u.name,
      avatar: u.avatar,
      occupation: u.occupation ?? null,
      nivel: u.nivel ?? null,
      activities: u.activities ?? [],
      city: u.city ?? null,
      state: u.state ?? null,
      isPremium: u.is_premium,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: "cefis_me_failed", message },
      { status: 502 }
    );
  }
}
