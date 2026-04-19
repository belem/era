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
