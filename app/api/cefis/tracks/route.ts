import { NextRequest, NextResponse } from "next/server";
import { cefisFetch } from "@/lib/cefis-client";
import type { CefisTracksListResponse } from "@/lib/types";

/**
 * GET /api/cefis/tracks
 *
 * Proxy server-side para CEFIS v3 GET /tracks.
 * Lista trilhas (study plans pré-curados pela CEFIS).
 *
 * Query: page, count, categories (CSV), filters (CSV — ex: "crc")
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const page = sp.get("page") ? Number(sp.get("page")) : undefined;
  const count = sp.get("count") ? Number(sp.get("count")) : undefined;
  const categories = sp.getAll("categories");
  const filters = sp.getAll("filters");

  try {
    const extra: Record<string, string> = {};
    if (categories.length) extra.categories = categories.join(",");
    if (filters.length) extra.filters = filters.join(",");

    const result = await cefisFetch<CefisTracksListResponse>({
      version: "v3",
      path: "/tracks",
      query: { page, count, ...extra },
      revalidate: 300,
    });

    const items = result.data.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      banner: t.banner ?? null,
      courseCount: t.course_count,
      duration: t.duration,
      categories: t.categories,
      rating: t.rating,
    }));

    return NextResponse.json({
      items,
      pagination: result.pagination,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: "cefis_tracks_failed", message },
      { status: 502 }
    );
  }
}
