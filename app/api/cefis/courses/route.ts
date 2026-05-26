import { NextRequest, NextResponse } from "next/server";
import { cefisFetch } from "@/lib/cefis-client";
import type { CefisCoursesListResponse } from "@/lib/types";

/**
 * GET /api/cefis/courses
 *
 * Proxy server-side para CEFIS v3 GET /courses.
 * Aceita query params: page, count, order, orderDirection, search,
 * categories (CSV), filter (CSV: quick|new|scored_crc), status (CSV).
 *
 * Retorna campos essenciais por curso pra reduzir payload no frontend.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const query: Record<string, string | number | undefined> = {
    page: sp.get("page") ? Number(sp.get("page")) : undefined,
    count: sp.get("count") ? Number(sp.get("count")) : undefined,
    order: sp.get("order") ?? undefined,
    orderDirection: sp.get("orderDirection") ?? undefined,
    search: sp.get("search") ?? undefined,
  };

  // categories e filter aceitam múltiplos valores via querystring repetido na API CEFIS
  const categories = sp.getAll("categories");
  const filter = sp.getAll("filter");
  const status = sp.getAll("status");

  try {
    // cefisFetch só aceita Record com valores simples; pra múltiplos valores,
    // precisamos montar manualmente a URL. Fazemos isso passando o primeiro
    // valor como query e adicionando os demais via comma-separated (CEFIS aceita).
    const extra: Record<string, string> = {};
    if (categories.length) extra.categories = categories.join(",");
    if (filter.length) extra.filter = filter.join(",");
    if (status.length) extra.status = status.join(",");

    const result = await cefisFetch<CefisCoursesListResponse>({
      version: "v3",
      path: "/courses",
      query: { ...query, ...extra },
      revalidate: 300, // 5min server-side
    });

    // Slim down per-course payload
    const items = result.data.map((c) => ({
      id: c.id,
      title: c.title,
      subtitle: c.subtitle ?? null,
      summary: c.summary ?? null,
      banner: c.banner ?? null,
      goals: c.goals ?? [],
      duration: c.duration,
      keywords: c.keywords ?? null,
      lessonCount: c.lessonCount,
      categories: c.categories,
      averageRating: c.averageRating ?? null,
      ratingQuantity: c.ratingQuantity ?? null,
      teacher: c.teacher
        ? { id: c.teacher.id, name: c.teacher.name }
        : null,
    }));

    return NextResponse.json({
      items,
      pagination: {
        total: result.total,
        page: result.page,
        pages: result.pages,
        perPage: result.limit,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: "cefis_courses_failed", message },
      { status: 502 }
    );
  }
}
