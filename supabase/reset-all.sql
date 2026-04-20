-- ==========================================================================
-- FULL RESET: Drop everything and recreate all tables, functions, triggers.
-- Run this in Supabase SQL Editor to start fresh.
-- After this, run seed-poems batches (01-17) then seed-poems-18-editions.sql.
-- ==========================================================================

-- ========== DROP EVERYTHING ==========

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS students_updated_at ON students;
DROP TRIGGER IF EXISTS reviews_updated_at ON poem_reviews;
DROP TRIGGER IF EXISTS fragment_decks_updated_at ON fragment_decks;
DROP TRIGGER IF EXISTS fragments_updated_at ON fragments;
DROP TRIGGER IF EXISTS fragment_reviews_updated_at ON fragment_reviews;
DROP TRIGGER IF EXISTS custom_poems_updated_at ON custom_poems;
DROP TRIGGER IF EXISTS students_auto_assign ON students;
DROP TRIGGER IF EXISTS poem_editions_auto_assign ON poem_editions;

-- Drop functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS compute_streak(UUID) CASCADE;
DROP FUNCTION IF EXISTS curriculum_sort_order(TEXT, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS assign_poems_for_student(UUID) CASCADE;
DROP FUNCTION IF EXISTS on_student_upsert() CASCADE;
DROP FUNCTION IF EXISTS on_poem_edition_insert() CASCADE;
DROP FUNCTION IF EXISTS reset_student_progress(UUID) CASCADE;

-- Drop tables (order matters for FK constraints)
DROP TABLE IF EXISTS listening_sessions CASCADE;
DROP TABLE IF EXISTS fragment_review_events CASCADE;
DROP TABLE IF EXISTS fragment_reviews CASCADE;
DROP TABLE IF EXISTS fragments CASCADE;
DROP TABLE IF EXISTS fragment_decks CASCADE;
DROP TABLE IF EXISTS guardian_invitations CASCADE;
DROP TABLE IF EXISTS badge_unlocks CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS scroll_completions CASCADE;
DROP TABLE IF EXISTS streaks CASCADE;
DROP TABLE IF EXISTS review_events CASCADE;
DROP TABLE IF EXISTS poem_reviews CASCADE;
DROP TABLE IF EXISTS custom_poems CASCADE;
DROP TABLE IF EXISTS poem_editions CASCADE;
DROP TABLE IF EXISTS poems CASCADE;
DROP TABLE IF EXISTS student_guardians CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_plan CASCADE;
DROP TYPE IF EXISTS srs_algorithm CASCADE;
DROP TYPE IF EXISTS guardian_role CASCADE;
DROP TYPE IF EXISTS review_source CASCADE;

-- ==========================================================================
-- CREATE TABLES
-- ==========================================================================

-- Profiles (user-editable display data)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  locale TEXT DEFAULT 'zh-CN',
  theme_preference TEXT DEFAULT 'system' CHECK (theme_preference IN ('system', 'light', 'dark')),
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Users (authorization data, security-critical)
CREATE TYPE user_role AS ENUM ('GUARDIAN', 'ADMIN');
CREATE TYPE user_plan AS ENUM ('FREE', 'PRO', 'MAX', 'ADMIN');

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role user_role DEFAULT 'GUARDIAN',
  plan user_plan DEFAULT 'FREE',
  accepted_terms_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Students
CREATE TYPE srs_algorithm AS ENUM ('SM2', 'LEITNER', 'FSRS');

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  school_system TEXT NOT NULL DEFAULT '六三' CHECK (school_system IN ('六三', '五四', '高中')),
  grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 9),
  edition TEXT NOT NULL DEFAULT '人教',
  algorithm srs_algorithm DEFAULT 'SM2',
  settings_json JSONB DEFAULT '{"show_pinyin": true}'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Guardian-student relationship (many-to-many)
CREATE TYPE guardian_role AS ENUM ('OWNER', 'VIEWER');

CREATE TABLE student_guardians (
  student_id UUID REFERENCES students ON DELETE CASCADE,
  guardian_id UUID REFERENCES auth.users ON DELETE CASCADE,
  role guardian_role DEFAULT 'OWNER',
  invited_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  PRIMARY KEY (student_id, guardian_id)
);

-- Poems (curated library — content only, edition/grade in poem_editions)
CREATE TABLE poems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  dynasty TEXT NOT NULL,
  content_lines JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Poem edition placements (which poems appear in which edition at which grade)
CREATE TABLE poem_editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poem_id UUID NOT NULL REFERENCES poems ON DELETE CASCADE,
  edition TEXT NOT NULL,
  school_system TEXT NOT NULL CHECK (school_system IN ('六三', '五四', '高中')),
  grade INTEGER CHECK (grade IS NULL OR grade BETWEEN 1 AND 9),
  semester TEXT CHECK (semester IS NULL OR semester IN ('上册', '下册')),
  page INTEGER,
  UNIQUE (poem_id, edition, school_system, grade, semester)
);

CREATE INDEX idx_poem_editions_lookup ON poem_editions(edition, school_system, grade, semester);

-- Custom poems (诗心 — paid tier)
CREATE TABLE custom_poems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  dynasty TEXT,
  content_lines JSONB NOT NULL,
  source_poem_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Poem reviews (SRS state per student per poem)
CREATE TYPE review_source AS ENUM ('SYSTEM', 'CUSTOM');

CREATE TABLE poem_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  poem_id UUID REFERENCES poems ON DELETE CASCADE,
  custom_poem_id UUID REFERENCES custom_poems ON DELETE CASCADE,
  source review_source DEFAULT 'SYSTEM',
  rating TEXT CHECK (rating IN ('forgot', 'hard', 'good', 'easy')),
  repetitions INTEGER DEFAULT 0,
  ease_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  leitner_box INTEGER DEFAULT 0,
  fsrs_stability FLOAT,
  fsrs_difficulty FLOAT,
  fsrs_reps INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  next_review_at TIMESTAMPTZ DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (num_nonnulls(poem_id, custom_poem_id) = 1),
  UNIQUE (student_id, poem_id),
  UNIQUE (student_id, custom_poem_id)
);

-- Append-only review event log
CREATE TABLE review_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  poem_id UUID REFERENCES poems ON DELETE CASCADE,
  custom_poem_id UUID REFERENCES custom_poems ON DELETE CASCADE,
  algorithm srs_algorithm NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('forgot', 'hard', 'good', 'easy')),
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(poem_id, custom_poem_id) = 1)
);

CREATE INDEX idx_review_events_student_date
  ON review_events(student_id, reviewed_at);

-- Streaks
CREATE TABLE streaks (
  student_id UUID PRIMARY KEY REFERENCES students ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_review_date DATE
);

-- Scroll completions (Living Scroll gallery)
CREATE TABLE scroll_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  poem_id UUID NOT NULL REFERENCES poems ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT now(),
  review_mode TEXT DEFAULT 'scroll'
);

-- Badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('scroll_count', 'streak_days', 'grade_mastered', 'review_count')),
  criteria_value INTEGER NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE badge_unlocks (
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (student_id, badge_id)
);

-- Guardian invitations
CREATE TABLE guardian_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  token UUID UNIQUE DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fragments (general flashcards — 集雅 module)
CREATE TABLE fragment_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#0071e3',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE fragments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES fragment_decks ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fragment reviews (SRS state per fragment)
CREATE TABLE fragment_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  fragment_id UUID NOT NULL REFERENCES fragments ON DELETE CASCADE,
  rating TEXT CHECK (rating IN ('forgot', 'hard', 'good', 'easy')),
  repetitions INTEGER DEFAULT 0,
  ease_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  leitner_box INTEGER DEFAULT 0,
  fsrs_stability FLOAT,
  fsrs_difficulty FLOAT,
  fsrs_reps INTEGER DEFAULT 0,
  next_review_at TIMESTAMPTZ DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, fragment_id)
);

-- Fragment review events (append-only log)
CREATE TABLE fragment_review_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  fragment_id UUID NOT NULL REFERENCES fragments ON DELETE CASCADE,
  algorithm srs_algorithm NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('forgot', 'hard', 'good', 'easy')),
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fragment_review_events_student_date
  ON fragment_review_events(student_id, reviewed_at);

-- Listening sessions (ear training analytics)
CREATE TABLE listening_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('passive', 'active')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  poems_played INTEGER DEFAULT 0,
  poems_rated INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0
);

CREATE INDEX idx_listening_sessions_student
  ON listening_sessions(student_id, started_at);

-- ==========================================================================
-- HELPER FUNCTIONS
-- ==========================================================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- ==========================================================================
-- RLS POLICIES
-- ==========================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE poems ENABLE ROW LEVEL SECURITY;
ALTER TABLE poem_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE poem_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scroll_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragment_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragment_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragment_review_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_poems ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_sessions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON students TO authenticated;
GRANT SELECT, INSERT ON student_guardians TO authenticated;
GRANT SELECT ON poems TO authenticated;
GRANT SELECT ON poem_editions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON poem_reviews TO authenticated;
GRANT SELECT, INSERT ON review_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON streaks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON scroll_completions TO authenticated;
GRANT SELECT ON badges TO authenticated;
GRANT SELECT, INSERT ON badge_unlocks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON guardian_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON fragment_decks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON fragments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON fragment_reviews TO authenticated;
GRANT SELECT, INSERT ON fragment_review_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON custom_poems TO authenticated;
GRANT SELECT, INSERT ON listening_sessions TO authenticated;
GRANT ALL ON poems TO service_role;
GRANT ALL ON poem_editions TO service_role;
GRANT ALL ON badges TO service_role;

-- Profiles
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Users
CREATE POLICY users_select ON users FOR SELECT USING (auth.uid() = id);

-- Students
CREATE POLICY students_select ON students FOR SELECT
  USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = id AND sg.guardian_id = auth.uid()));
CREATE POLICY students_insert ON students FOR INSERT
  WITH CHECK (created_by = auth.uid());
CREATE POLICY students_update ON students FOR UPDATE
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = id AND sg.guardian_id = auth.uid() AND sg.role = 'OWNER'));

-- Student guardians
CREATE POLICY sg_select ON student_guardians FOR SELECT
  USING (guardian_id = auth.uid());
CREATE POLICY sg_insert ON student_guardians FOR INSERT
  WITH CHECK (guardian_id = auth.uid());

-- Poems: public read, admin write
CREATE POLICY poems_select ON poems FOR SELECT USING (true);
CREATE POLICY poems_insert ON poems FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY poems_update ON poems FOR UPDATE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY poems_delete ON poems FOR DELETE
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'));

-- Poem editions: public read, admin write
CREATE POLICY poem_editions_select ON poem_editions FOR SELECT USING (true);
CREATE POLICY poem_editions_insert ON poem_editions FOR INSERT WITH CHECK (is_admin());
CREATE POLICY poem_editions_update ON poem_editions FOR UPDATE USING (is_admin());
CREATE POLICY poem_editions_delete ON poem_editions FOR DELETE USING (is_admin());

-- Admin: read all
CREATE POLICY users_select_admin ON users FOR SELECT USING (is_admin());
CREATE POLICY profiles_select_admin ON profiles FOR SELECT USING (is_admin());
CREATE POLICY students_select_admin ON students FOR SELECT USING (is_admin());
CREATE POLICY review_events_select_admin ON review_events FOR SELECT USING (is_admin());

-- Poem reviews
CREATE POLICY reviews_select ON poem_reviews FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = poem_reviews.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY reviews_insert ON poem_reviews FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = poem_reviews.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY reviews_update ON poem_reviews FOR UPDATE
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = poem_reviews.student_id AND sg.guardian_id = auth.uid()));

-- Streaks
CREATE POLICY streaks_select ON streaks FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = streaks.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY streaks_upsert ON streaks FOR ALL
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = streaks.student_id AND sg.guardian_id = auth.uid()));

-- Scroll completions
CREATE POLICY scrolls_select ON scroll_completions FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = scroll_completions.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY scrolls_insert ON scroll_completions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = scroll_completions.student_id AND sg.guardian_id = auth.uid()));

-- Review events
CREATE POLICY review_events_select ON review_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = review_events.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY review_events_insert ON review_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = review_events.student_id AND sg.guardian_id = auth.uid()));

-- Badges
CREATE POLICY badges_select ON badges FOR SELECT USING (true);
CREATE POLICY badge_unlocks_select ON badge_unlocks FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = badge_unlocks.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY badge_unlocks_insert ON badge_unlocks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = badge_unlocks.student_id AND sg.guardian_id = auth.uid()));

-- Guardian invitations
CREATE POLICY invitations_select ON guardian_invitations FOR SELECT
  USING (invited_by = auth.uid());
CREATE POLICY invitations_insert ON guardian_invitations FOR INSERT
  WITH CHECK (invited_by = auth.uid());
CREATE POLICY invitations_select_by_email ON guardian_invitations FOR SELECT
  USING (invited_email = (auth.jwt() ->> 'email'));

-- Fragment decks
CREATE POLICY fragment_decks_select ON fragment_decks FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_decks.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragment_decks_insert ON fragment_decks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_decks.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragment_decks_update ON fragment_decks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_decks.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragment_decks_delete ON fragment_decks FOR DELETE
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_decks.student_id AND sg.guardian_id = auth.uid()));

-- Fragments
CREATE POLICY fragments_select ON fragments FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragments.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragments_insert ON fragments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragments.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragments_update ON fragments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragments.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragments_delete ON fragments FOR DELETE
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragments.student_id AND sg.guardian_id = auth.uid()));

-- Fragment reviews
CREATE POLICY fragment_reviews_select ON fragment_reviews FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_reviews.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragment_reviews_insert ON fragment_reviews FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_reviews.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragment_reviews_update ON fragment_reviews FOR UPDATE
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_reviews.student_id AND sg.guardian_id = auth.uid()));

-- Fragment review events
CREATE POLICY fragment_review_events_select ON fragment_review_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_review_events.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragment_review_events_insert ON fragment_review_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_review_events.student_id AND sg.guardian_id = auth.uid()));

-- Custom poems
CREATE POLICY custom_poems_select ON custom_poems FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = custom_poems.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY custom_poems_insert ON custom_poems FOR INSERT
  WITH CHECK (created_by = auth.uid());
CREATE POLICY custom_poems_update ON custom_poems FOR UPDATE
  USING (created_by = auth.uid());
CREATE POLICY custom_poems_delete ON custom_poems FOR DELETE
  USING (created_by = auth.uid());

-- Listening sessions
CREATE POLICY listening_sessions_select ON listening_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = listening_sessions.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY listening_sessions_insert ON listening_sessions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = listening_sessions.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY listening_sessions_update ON listening_sessions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = listening_sessions.student_id AND sg.guardian_id = auth.uid()));

-- ==========================================================================
-- SEED: BADGES
-- ==========================================================================

INSERT INTO badges (name, description, criteria_type, criteria_value, icon) VALUES
  ('初卷', 'Complete your first Living Scroll', 'scroll_count', 1, 'scroll'),
  ('七日', 'Maintain a 7-day review streak', 'streak_days', 7, 'flame'),
  ('明月', 'Maintain a 30-day review streak', 'streak_days', 30, 'moon'),
  ('年级通', 'Master all poems in one grade', 'grade_mastered', 1, 'star'),
  ('百篇', 'Review 100 poems total', 'review_count', 100, 'seal');

-- ==========================================================================
-- TRIGGERS
-- ==========================================================================

-- Auto-create profile + user row on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (new.id);
  INSERT INTO public.users (id, accepted_terms_at)
  VALUES (
    new.id,
    (new.raw_user_meta_data->>'accepted_terms_at')::TIMESTAMPTZ
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON poem_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER fragment_decks_updated_at BEFORE UPDATE ON fragment_decks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER fragments_updated_at BEFORE UPDATE ON fragments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER fragment_reviews_updated_at BEFORE UPDATE ON fragment_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER custom_poems_updated_at BEFORE UPDATE ON custom_poems FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================================================
-- STREAK RPC (002_streak_rpc.sql)
-- ==========================================================================

CREATE OR REPLACE FUNCTION compute_streak(p_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  v_settings JSONB;
  v_freeze_enabled BOOLEAN;
  v_freeze_used TEXT;
  v_dates DATE[];
  v_today DATE := CURRENT_DATE;
  v_streak INTEGER := 0;
  v_check_date DATE;
  v_frozen_this_week BOOLEAN := FALSE;
  v_longest INTEGER;
  v_iso_week_used INTEGER;
  v_iso_year_used INTEGER;
  v_iso_week_now INTEGER;
  v_iso_year_now INTEGER;
BEGIN
  INSERT INTO streaks (student_id, current_streak, longest_streak, last_review_date)
  VALUES (p_student_id, 0, 0, NULL)
  ON CONFLICT (student_id) DO NOTHING;

  PERFORM 1 FROM streaks WHERE student_id = p_student_id FOR UPDATE;

  v_settings := COALESCE(
    (SELECT settings_json FROM students WHERE id = p_student_id),
    jsonb_build_object()
  );

  v_freeze_enabled := COALESCE((v_settings->>'streak_freeze_enabled')::boolean, FALSE);
  v_freeze_used := v_settings->>'streak_freeze_used_this_week';

  IF v_freeze_used IS NOT NULL THEN
    v_iso_week_used := EXTRACT(WEEK FROM v_freeze_used::date);
    v_iso_year_used := EXTRACT(ISOYEAR FROM v_freeze_used::date);
    v_iso_week_now := EXTRACT(WEEK FROM v_today);
    v_iso_year_now := EXTRACT(ISOYEAR FROM v_today);
    IF v_iso_week_used != v_iso_week_now OR v_iso_year_used != v_iso_year_now THEN
      v_freeze_used := NULL;
    END IF;
  END IF;

  v_dates := ARRAY(
    SELECT DISTINCT (reviewed_at AT TIME ZONE 'UTC')::date
    FROM review_events
    WHERE student_id = p_student_id
    ORDER BY 1 DESC
  );

  IF v_dates IS NULL OR array_length(v_dates, 1) IS NULL THEN
    UPDATE streaks SET current_streak = 0, last_review_date = NULL
    WHERE student_id = p_student_id;
    RETURN jsonb_build_object('currentStreak', 0, 'longestStreak', 0, 'frozen', FALSE);
  END IF;

  v_check_date := v_today;

  IF v_dates[1] = v_today THEN
    v_streak := 1;
    v_check_date := v_today - 1;
  END IF;

  FOR i IN 1..365 LOOP
    IF v_check_date = ANY(v_dates) THEN
      v_streak := v_streak + 1;
      v_check_date := v_check_date - 1;
    ELSIF v_freeze_enabled AND NOT v_frozen_this_week AND v_freeze_used IS NULL THEN
      v_frozen_this_week := TRUE;
      v_streak := v_streak + 1;
      v_check_date := v_check_date - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;

  v_longest := COALESCE(
    (SELECT longest_streak FROM streaks WHERE student_id = p_student_id),
    0
  );
  v_longest := GREATEST(v_longest, v_streak);

  UPDATE streaks
  SET current_streak = v_streak,
      longest_streak = v_longest,
      last_review_date = v_today
  WHERE student_id = p_student_id;

  IF v_frozen_this_week AND v_freeze_used IS NULL THEN
    UPDATE students
    SET settings_json = jsonb_set(
      COALESCE(settings_json, jsonb_build_object()),
      ARRAY['streak_freeze_used_this_week'],
      to_jsonb(v_today::text)
    )
    WHERE id = p_student_id;
  END IF;

  RETURN jsonb_build_object(
    'currentStreak', v_streak,
    'longestStreak', v_longest,
    'frozen', v_frozen_this_week
  );
END;
$func$;

-- ==========================================================================
-- AUTO-ASSIGN POEMS (004_auto_assign_poems.sql)
-- ==========================================================================

CREATE OR REPLACE FUNCTION curriculum_sort_order(p_school_system TEXT, p_grade INTEGER, p_semester TEXT DEFAULT NULL)
RETURNS INTEGER
LANGUAGE sql IMMUTABLE
AS $$
  SELECT (CASE p_school_system
    WHEN '高中' THEN 100
    ELSE 0
  END + COALESCE(p_grade, 0)) * 10
  + CASE p_semester WHEN '上册' THEN 0 WHEN '下册' THEN 1 ELSE 0 END;
$$;

CREATE OR REPLACE FUNCTION assign_poems_for_student(p_student_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO poem_reviews (student_id, poem_id, source, sort_order)
  SELECT DISTINCT ON (pe.poem_id)
    p_student_id,
    pe.poem_id,
    'SYSTEM',
    curriculum_sort_order(pe.school_system, pe.grade, pe.semester)
  FROM poem_editions pe
  JOIN students s ON s.id = p_student_id
  WHERE pe.edition = s.edition
    AND pe.school_system = s.school_system
  ORDER BY pe.poem_id, curriculum_sort_order(pe.school_system, pe.grade, pe.semester)
  ON CONFLICT (student_id, poem_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION on_student_upsert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR NEW.edition IS DISTINCT FROM OLD.edition
     OR NEW.school_system IS DISTINCT FROM OLD.school_system
     OR NEW.grade IS DISTINCT FROM OLD.grade
  THEN
    PERFORM assign_poems_for_student(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER students_auto_assign
  AFTER INSERT OR UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION on_student_upsert();

CREATE OR REPLACE FUNCTION on_poem_edition_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO poem_reviews (student_id, poem_id, source, sort_order)
  SELECT s.id, NEW.poem_id, 'SYSTEM', curriculum_sort_order(NEW.school_system, NEW.grade, NEW.semester)
  FROM students s
  WHERE s.edition = NEW.edition
    AND s.school_system = NEW.school_system
  ON CONFLICT (student_id, poem_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER poem_editions_auto_assign
  AFTER INSERT ON poem_editions
  FOR EACH ROW EXECUTE FUNCTION on_poem_edition_insert();

CREATE OR REPLACE FUNCTION reset_student_progress(p_student_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM review_events WHERE student_id = p_student_id AND poem_id IS NOT NULL;
  DELETE FROM scroll_completions WHERE student_id = p_student_id;
  DELETE FROM poem_reviews WHERE student_id = p_student_id AND source = 'SYSTEM';
  UPDATE streaks SET current_streak = 0, longest_streak = 0, last_review_date = NULL
    WHERE student_id = p_student_id;
  PERFORM assign_poems_for_student(p_student_id);
END;
$$;
