// ============================================
// Admin-Ready Content Interfaces
// All content is designed to be dynamic and
// driven by an admin panel / CMS backend.
// ============================================

// ---------- Base ----------
export interface BaseContent {
  id: string;
  title: string;
  order_index: number;
  published_at: string | null;
  is_active: boolean;
}

// ---------- Quiz ----------
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Quiz extends BaseContent {
  questions: QuizQuestion[];
  topic: string;
  duration_estimate: string; // e.g. "3 min"
}

// ---------- Snippet ----------
export interface Snippet extends BaseContent {
  topic: string;
  content: string;
  image: string;
  example: string;
  quiz: QuizQuestion[];
}

// ---------- Daily Content ----------
export interface DailyVocab {
  id: string;
  term: string;
  meaning: string;
  example: string;
}

export interface DailyLongRead extends BaseContent {
  type: "biography" | "case-study";
  subject: string;
  duration: string;
  preview: string;
  content: string;
}

export interface DailyContent {
  date: string; // yyyy-MM-dd
  quiz: Quiz | null;
  vocab: DailyVocab | null;
  longRead: DailyLongRead | null;
}

// ---------- Roadmap ----------
export interface RoadmapUnit extends BaseContent {
  content: string;
  quiz: QuizQuestion[];
}

export interface Roadmap extends BaseContent {
  description: string;
  category_id: string;
  units: RoadmapUnit[];
}

export interface RoadmapCategory {
  id: string;
  title: string;
  icon: string; // icon key
  roadmaps: Roadmap[];
}

// ---------- User State ----------
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  max_score: number;
  completed_at: string;
  source: "daily" | "roadmap" | "snippet";
}

export interface StreakRecord {
  current_streak: number;
  longest_streak: number;
  streak_history: Record<string, boolean>; // date -> quiz attempted
  last_quiz_date: string | null;
}

export interface RoadmapProgress {
  roadmap_id: string;
  completed_unit_ids: string[];
  last_unit_id: string | null;
  started_at: string;
  updated_at: string;
}

export interface UserProgress {
  user_id: string;
  streak: StreakRecord;
  quiz_attempts: QuizAttempt[];
  roadmap_progress: RoadmapProgress[];
  daily_completion: Record<string, boolean>; // date -> quiz attempted today
}
