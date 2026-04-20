-- Auto-assign ALL system poems to each student, ordered by curriculum progression.
-- sort_order: grade directly (1-9 for 义务教育, 101-103 for 高中)
-- Fires on: student INSERT/UPDATE, poem_editions INSERT.

ALTER TABLE poem_reviews ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION curriculum_sort_order(p_level TEXT, p_grade INTEGER)
RETURNS INTEGER
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE p_level
    WHEN '义务教育' THEN 0
    WHEN '高中' THEN 100
    ELSE 200
  END + COALESCE(p_grade, 0);
$$;

-- Assign all poems from the student's edition + school_system
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
    curriculum_sort_order(pe.level, pe.grade)
  FROM poem_editions pe
  JOIN students s ON s.id = p_student_id
  WHERE pe.edition = s.edition
    AND pe.school_system = s.school_system
  ORDER BY pe.poem_id, curriculum_sort_order(pe.level, pe.grade)
  ON CONFLICT (student_id, poem_id) DO NOTHING;
END;
$$;

-- Trigger: new student created, or student changes edition/school_system/grade
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

-- Trigger: new poem_edition row added (admin adds a poem to a curriculum slot)
CREATE OR REPLACE FUNCTION on_poem_edition_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO poem_reviews (student_id, poem_id, source, sort_order)
  SELECT s.id, NEW.poem_id, 'SYSTEM', curriculum_sort_order(NEW.level, NEW.grade)
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

-- Reset all system learning progress for a student, then re-assign poems
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
