import { NextRequest, NextResponse } from "next/server";
import { cefisFetch } from "@/lib/cefis-client";
import type { CefisLessonsListResponse } from "@/lib/types";

/**
 * GET /api/cefis/courses/:id/lessons
 *
 * Proxy server-side pra CEFIS v3 GET /courses/:id/lessons.
 * Retorna lista ordenada de aulas (id, title, position, duration).
 * Stream_sources e progress são removidos do payload — frontend só precisa
 * dos metadados pra escolher aula a consultar via subtitles.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await ctx.params;
  const id = Number(idStr);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "invalid_course_id", message: "id deve ser inteiro positivo." },
      { status: 400 }
    );
  }

  try {
    const result = await cefisFetch<CefisLessonsListResponse>({
      version: "v3",
      path: `/courses/${id}/lessons`,
      revalidate: 600,
    });

    const items = (result.data ?? []).map((l) => ({
      id: l.id,
      title: l.title,
      position: l.position,
      duration: l.duration,
    }));

    return NextResponse.json({
      courseId: id,
      lessonCount: items.length,
      items,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json(
      { error: "lessons_failed", courseId: id, message },
      { status: 502 }
    );
  }
}
