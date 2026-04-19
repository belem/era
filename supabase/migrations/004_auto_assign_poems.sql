-- Auto-assign ALL system poems to each student, ordered by curriculum progression.
-- sort_order: 小学g1 = 100..106, 初中g1 = 200..206, 高中g1 = 300..306
-- Fires on: student INSERT/UPDATE, poem_editions INSERT.

ALTER TABLE poem_reviews ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION curriculum_sort_order(p_level TEXT, p_grade INTEGER)
RETURNS INTEGER
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE p_level
    WHEN '小学' THEN 100
    WHEN '初中' THEN 200
    WHEN '高中' THEN 300
    ELSE 400
  END + COALESCE(p_grade, 0);
$$;

-- Assign all poems from the student's edition across every level/grade
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
  ORDER BY pe.poem_id, curriculum_sort_order(pe.level, pe.grade)
  ON CONFLICT (student_id, poem_id) DO NOTHING;
END;
$$;

-- Trigger: new student created, or student changes edition/level/grade
CREATE OR REPLACE FUNCTION on_student_upsert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR NEW.edition IS DISTINCT FROM OLD.edition
     OR NEW.level IS DISTINCT FROM OLD.level
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
  ON CONFLICT (student_id, poem_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER poem_editions_auto_assign
  AFTER INSERT ON poem_editions
  FOR EACH ROW EXECUTE FUNCTION on_poem_edition_insert();
