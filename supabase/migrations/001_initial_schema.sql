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
  grade INTEGER NOT NULL CHECK (grade BETWEEN 1 AND 9),
  edition TEXT DEFAULT 'PEP',
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

-- Poems (curated library)
CREATE TABLE poems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  dynasty TEXT NOT NULL,
  grade_level INTEGER NOT NULL,
  edition TEXT DEFAULT 'PEP',
  content_lines JSONB NOT NULL, -- [{chars: [{char, pinyin, polyphone?}], punctuation}]
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Poem reviews (SRS state per student per poem)
CREATE TYPE review_source AS ENUM ('SYSTEM', 'CUSTOM');

CREATE TABLE poem_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  poem_id UUID NOT NULL REFERENCES poems ON DELETE CASCADE,
  source review_source DEFAULT 'SYSTEM',
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
  UNIQUE (student_id, poem_id)
);

-- Append-only review event log. poem_reviews stays as current-state snapshot.
CREATE TABLE review_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  poem_id UUID NOT NULL REFERENCES poems ON DELETE CASCADE,
  algorithm srs_algorithm NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('forgot', 'hard', 'good', 'easy')),
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
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

-- ========== RLS POLICIES ==========

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE poems ENABLE ROW LEVEL SECURITY;
ALTER TABLE poem_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scroll_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_invitations ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Users: read own row only
CREATE POLICY users_select ON users FOR SELECT USING (auth.uid() = id);

-- Students: accessible only by linked guardians
CREATE POLICY students_select ON students FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = id AND sg.guardian_id = auth.uid()));
CREATE POLICY students_insert ON students FOR INSERT
  WITH CHECK (created_by = auth.uid());
CREATE POLICY students_update ON students FOR UPDATE
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = id AND sg.guardian_id = auth.uid() AND sg.role = 'OWNER'));

-- Student guardians: guardians can see their own links
CREATE POLICY sg_select ON student_guardians FOR SELECT
  USING (guardian_id = auth.uid());
CREATE POLICY sg_insert ON student_guardians FOR INSERT
  WITH CHECK (guardian_id = auth.uid());

-- Poems: public read
CREATE POLICY poems_select ON poems FOR SELECT USING (true);

-- Poem reviews: only for linked students
CREATE POLICY reviews_select ON poem_reviews FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = poem_reviews.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY reviews_insert ON poem_reviews FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = poem_reviews.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY reviews_update ON poem_reviews FOR UPDATE
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = poem_reviews.student_id AND sg.guardian_id = auth.uid()));

-- Streaks: same as reviews
CREATE POLICY streaks_select ON streaks FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = streaks.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY streaks_upsert ON streaks FOR ALL
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = streaks.student_id AND sg.guardian_id = auth.uid()));

-- Scroll completions: same pattern
CREATE POLICY scrolls_select ON scroll_completions FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = scroll_completions.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY scrolls_insert ON scroll_completions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = scroll_completions.student_id AND sg.guardian_id = auth.uid()));

-- Review events: same guardian pattern as poem_reviews
CREATE POLICY review_events_select ON review_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = review_events.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY review_events_insert ON review_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = review_events.student_id AND sg.guardian_id = auth.uid()));

-- Badges: public read (badge catalog is visible to everyone)
CREATE POLICY badges_select ON badges FOR SELECT USING (true);

-- Badge unlocks: same guardian pattern
CREATE POLICY badge_unlocks_select ON badge_unlocks FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = badge_unlocks.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY badge_unlocks_insert ON badge_unlocks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = badge_unlocks.student_id AND sg.guardian_id = auth.uid()));

-- Guardian invitations: inviter can manage, invited user can read by token
CREATE POLICY invitations_select ON guardian_invitations FOR SELECT
  USING (invited_by = auth.uid());
CREATE POLICY invitations_insert ON guardian_invitations FOR INSERT
  WITH CHECK (invited_by = auth.uid());
CREATE POLICY invitations_select_by_email ON guardian_invitations FOR SELECT
  USING (invited_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

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

-- Fragment reviews (SRS state per student per fragment, mirrors poem_reviews)
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

-- Fragment review events (append-only log, mirrors review_events)
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

-- Custom poems (诗心 — paid tier)
CREATE TABLE custom_poems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT,
  dynasty TEXT,
  content_lines JSONB NOT NULL,
  source_poem_id TEXT, -- reference to chinese-poetry dataset ID if autocompleted
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

-- ========== RLS: PHASE 3 TABLES ==========

ALTER TABLE fragment_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragment_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE fragment_review_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_poems ENABLE ROW LEVEL SECURITY;
ALTER TABLE listening_sessions ENABLE ROW LEVEL SECURITY;

-- Fragment decks: guardian access via student link
CREATE POLICY fragment_decks_select ON fragment_decks FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_decks.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragment_decks_insert ON fragment_decks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_decks.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragment_decks_update ON fragment_decks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_decks.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragment_decks_delete ON fragment_decks FOR DELETE
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_decks.student_id AND sg.guardian_id = auth.uid()));

-- Fragments: same guardian pattern
CREATE POLICY fragments_select ON fragments FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragments.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragments_insert ON fragments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragments.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragments_update ON fragments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragments.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragments_delete ON fragments FOR DELETE
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragments.student_id AND sg.guardian_id = auth.uid()));

-- Fragment reviews: same guardian pattern
CREATE POLICY fragment_reviews_select ON fragment_reviews FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_reviews.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragment_reviews_insert ON fragment_reviews FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_reviews.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragment_reviews_update ON fragment_reviews FOR UPDATE
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_reviews.student_id AND sg.guardian_id = auth.uid()));

-- Fragment review events: same pattern
CREATE POLICY fragment_review_events_select ON fragment_review_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_review_events.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY fragment_review_events_insert ON fragment_review_events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = fragment_review_events.student_id AND sg.guardian_id = auth.uid()));

-- Custom poems: creator + linked guardians
CREATE POLICY custom_poems_select ON custom_poems FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = custom_poems.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY custom_poems_insert ON custom_poems FOR INSERT
  WITH CHECK (created_by = auth.uid());
CREATE POLICY custom_poems_update ON custom_poems FOR UPDATE
  USING (created_by = auth.uid());
CREATE POLICY custom_poems_delete ON custom_poems FOR DELETE
  USING (created_by = auth.uid());

-- Listening sessions: guardian access
CREATE POLICY listening_sessions_select ON listening_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = listening_sessions.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY listening_sessions_insert ON listening_sessions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = listening_sessions.student_id AND sg.guardian_id = auth.uid()));
CREATE POLICY listening_sessions_update ON listening_sessions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM student_guardians sg WHERE sg.student_id = listening_sessions.student_id AND sg.guardian_id = auth.uid()));

-- ========== SEED: BADGES ==========

INSERT INTO badges (name, description, criteria_type, criteria_value, icon) VALUES
  ('初卷', 'Complete your first Living Scroll', 'scroll_count', 1, 'scroll'),
  ('七日', 'Maintain a 7-day review streak', 'streak_days', 7, 'flame'),
  ('明月', 'Maintain a 30-day review streak', 'streak_days', 30, 'moon'),
  ('年级通', 'Master all poems in one grade', 'grade_mastered', 1, 'star'),
  ('百篇', 'Review 100 poems total', 'review_count', 100, 'seal');

-- ========== TRIGGERS ==========

-- Auto-create profile + user row on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (new.id);
  INSERT INTO users (id, accepted_terms_at)
  VALUES (
    new.id,
    (new.raw_user_meta_data->>'accepted_terms_at')::TIMESTAMPTZ
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
