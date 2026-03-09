-- SwiftEd + EasyScribe Unified Database Schema for Supabase
-- Run this in Supabase SQL Editor (safe to re-run - uses IF NOT EXISTS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- SNIPPETS TABLE (richer schema for admin panel)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.snippets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic TEXT NOT NULL,          -- category / topic name
  title TEXT NOT NULL,
  content TEXT NOT NULL,        -- main body (markdown supported)
  example TEXT DEFAULT '',      -- example block
  image_url TEXT DEFAULT '',
  quiz JSONB DEFAULT '[]'::jsonb,  -- array of {id, text, options, correctIndex, explanation}
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ROADMAPS TABLE (richer schema for admin panel)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image TEXT DEFAULT '',
  icon TEXT DEFAULT 'BookOpen',
  units JSONB DEFAULT '[]'::jsonb,   -- array of {id, title, order, body, quiz}
  snippet_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- DAILY CONTENT TABLE (for the Daily tab)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  body TEXT NOT NULL,
  quiz JSONB DEFAULT '[]'::jsonb,
  vocab JSONB DEFAULT '[]'::jsonb,  -- array of {id, word, meaning, example}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- USER PROGRESS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  snippet_id UUID REFERENCES public.snippets(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, snippet_id)
);

-- ============================================================
-- BOOKMARKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  snippet_id UUID REFERENCES public.snippets(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, snippet_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Users: own profile only
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

-- Snippets: anyone authenticated can read published; anon can also read (for admin preview)
DROP POLICY IF EXISTS "Anyone can view published snippets" ON public.snippets;
CREATE POLICY "Anyone can view published snippets" ON public.snippets FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can insert snippets" ON public.snippets;
CREATE POLICY "Admin can insert snippets" ON public.snippets FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin can update snippets" ON public.snippets;
CREATE POLICY "Admin can update snippets" ON public.snippets FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Admin can delete snippets" ON public.snippets;
CREATE POLICY "Admin can delete snippets" ON public.snippets FOR DELETE USING (true);

-- Roadmaps: open read/write for admin
DROP POLICY IF EXISTS "Anyone can view roadmaps" ON public.roadmaps;
CREATE POLICY "Anyone can view roadmaps" ON public.roadmaps FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can insert roadmaps" ON public.roadmaps;
CREATE POLICY "Admin can insert roadmaps" ON public.roadmaps FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admin can update roadmaps" ON public.roadmaps;
CREATE POLICY "Admin can update roadmaps" ON public.roadmaps FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Admin can delete roadmaps" ON public.roadmaps;
CREATE POLICY "Admin can delete roadmaps" ON public.roadmaps FOR DELETE USING (true);

-- Daily content: open read/write for admin
DROP POLICY IF EXISTS "Anyone can view daily content" ON public.daily_content;
CREATE POLICY "Anyone can view daily content" ON public.daily_content FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage daily content" ON public.daily_content;
CREATE POLICY "Admin can manage daily content" ON public.daily_content FOR ALL USING (true);

-- User progress: own records only
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;
CREATE POLICY "Users can view their own progress" ON public.user_progress FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.user_progress;
CREATE POLICY "Users can insert their own progress" ON public.user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_progress;
CREATE POLICY "Users can update their own progress" ON public.user_progress FOR UPDATE USING (auth.uid() = user_id);

-- Bookmarks: own records only
DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view their own bookmarks" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can insert their own bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_snippets_topic ON public.snippets(topic);
CREATE INDEX IF NOT EXISTS idx_snippets_status ON public.snippets(status);
CREATE INDEX IF NOT EXISTS idx_roadmaps_category ON public.roadmaps(category);
CREATE INDEX IF NOT EXISTS idx_roadmaps_status ON public.roadmaps(status);
CREATE INDEX IF NOT EXISTS idx_daily_content_date ON public.daily_content(date);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DAILY CONTENT TABLE (quiz, vocab, long read per date)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.daily_content (
  date TEXT NOT NULL,           -- e.g. "2026-02-19"
  type TEXT NOT NULL CHECK (type IN ('quiz', 'vocab', 'longread')),
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (date, type)
);

-- Allow public read access (no auth required for frontend)
ALTER TABLE public.daily_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Allow public read daily_content"
  ON public.daily_content FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow service role write daily_content"
  ON public.daily_content FOR ALL USING (true);


-- ============================================================
-- USER TRACKING TABLES (Stats & Streaks)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  snippets_completed INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  quizzes_today INTEGER DEFAULT 0,
  streak_history JSONB DEFAULT '{}'::jsonb,
  milestones JSONB DEFAULT '{"firstStreak":false,"firstRoadmapUnit":false}'::jsonb,
  last_active_roadmap JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own stats" ON public.user_stats 
  FOR ALL USING (auth.uid() = user_id);
  
CREATE POLICY "Users can manage own streaks" ON public.user_streaks 
  FOR ALL USING (auth.uid() = user_id);

