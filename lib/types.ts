/**
 * Tipos TypeScript baseados na documentação oficial da API CEFIS
 * Hackathon de Inovação em Aprendizado · 26/05/2026
 *
 * Bases:
 * - v1: https://cefis.com.br (login, /user/me)
 * - v3: https://api-v3.cefis.com.br (courses, tracks, performance)
 */

// ──────────────── User (v1) ────────────────

export type CefisUser = {
  id: number;
  name: string;
  first_name: string;
  email: string;
  avatar: string | null;
  profile: string | null;
  birthdate?: string | null;
  occupation?: string | null;
  nivel?: number | null;
  certified_name?: string | null;
  registered_at?: string;
  activities?: string[];
  city?: string | null;
  state?: string | null;
  is_premium: boolean;
  is_demo_subscriber: boolean;
  premium_plan_active: boolean;
  is_admin: boolean;
  is_teacher: boolean;
  is_team_admin: boolean;
};

export type CefisUserResponse = { data: CefisUser };

// ──────────────── Courses (v3) ────────────────

export type CefisTeacher = {
  id: number;
  name: string;
  avatar?: string | null;
};

export type CefisCourseProgress = {
  lessonId?: number;
  percentage?: number;
  seconds?: number;
  completed?: boolean;
  completedAt?: string | null;
  updatedAt?: string;
} | null;

export type CefisCourse = {
  id: number;
  title: string;
  subtitle?: string;
  summary?: string;
  banner?: string;
  goals?: string[];
  teacher?: CefisTeacher;
  duration: number; // seconds
  keywords?: string; // semicolon-separated
  certificationThreshold?: number;
  lessonCount: number;
  materialCount?: number;
  hasMaterials?: boolean;
  categories: number[]; // 1-7
  ratingQuantity?: number;
  averageRating?: number;
  practiceAverage?: number;
  trailer?: unknown;
  crcActive?: boolean;
  crcCreditHours?: number;
  crcScore?: unknown;
  launchDate?: string;
  recordedAt?: string;
  createdAt?: string;
  // Only when authenticated:
  watchLater?: boolean;
  progress?: CefisCourseProgress;
};

export type CefisCoursesListResponse = {
  data: CefisCourse[];
  total: number;
  limit: number;
  page: number;
  pages: number;
};

export type CefisCourseDetailResponse = { data: CefisCourse };

// ──────────────── Lessons (v3) ────────────────

export type CefisStreamSource = {
  quality: "sd" | "hd";
  type: string;
  link_secure: string;
  height: 360 | 480 | 720 | 1080;
};

export type CefisLessonProgress = {
  id: number;
  seconds: number;
  percentage: number;
  lastSecond: number;
  createdAt: string;
  updatedAt: string;
} | null;

export type CefisLesson = {
  id: number;
  title: string;
  position: number;
  duration: number;
  preview_url: string | null;
  stream_sources: CefisStreamSource[];
  progress?: CefisLessonProgress;
};

export type CefisLessonsListResponse = { data: CefisLesson[] };

// ──────────────── Tracks (v3) ────────────────

export type CefisTrackSummary = {
  id: number;
  user_id: number;
  user: { id: number; name: string; avatar?: string };
  name: string;
  description: string;
  banner?: string;
  public: boolean;
  shared_team: boolean;
  course_count: number;
  duration: number;
  following: boolean;
  categories: number[];
  rating: number | null;
  created_at: string;
  updated_at: string;
};

export type CefisTracksListResponse = {
  data: CefisTrackSummary[];
  pagination: {
    totalItems: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
  };
};

export type CefisTrackDetail = CefisTrackSummary & {
  courses: Array<
    Pick<
      CefisCourse,
      | "id"
      | "title"
      | "subtitle"
      | "duration"
      | "lessonCount"
      | "materialCount"
      | "categories"
      | "watchLater"
      | "averageRating"
      | "practiceAverage"
      | "crcActive"
      | "crcCreditHours"
      | "teacher"
      | "progress"
    >
  >;
};

// ──────────────── Categories (1-7) ────────────────

// Os IDs 1-7 são definidos pela CEFIS. Nomes não vêm na API — mapeamento
// será inferido após coleta de cursos reais. Por ora, IDs anônimos.
export type CefisCategoryId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// ──────────────── Error format ────────────────

export type CefisErrorResponse = {
  error: string;
  message: string;
  status: number;
};
