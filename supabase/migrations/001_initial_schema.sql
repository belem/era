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
  next_review_at TIMESTAMPTZ DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (student_id, poem_id)
);

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

-- ========== RLS POLICIES ==========

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE poems ENABLE ROW LEVEL SECURITY;
ALTER TABLE poem_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scroll_completions ENABLE ROW LEVEL SECURITY;

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

-- ========== TRIGGERS ==========

-- Auto-create profile + user row on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id) VALUES (new.id);
  INSERT INTO users (id) VALUES (new.id);
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
