-- =============================================================================
-- 005_harden_user_trigger.sql
--
-- Harden handle_new_user() so a failure inside the trigger NEVER aborts the
-- auth.users INSERT. Without this, any error in the trigger (RLS, NOT NULL
-- mismatch, type cast, GRANT, etc.) bubbles up as `unexpected_failure` from
-- Supabase's OAuth handshake, breaking GitHub / Google sign-in entirely.
--
-- Strategy:
--   1. Wrap each public-schema INSERT in its own BEGIN/EXCEPTION/END.
--   2. Use ON CONFLICT DO NOTHING so re-runs (e.g. confirm-email retries on a
--      partially created user) don't error.
--   3. RAISE WARNING but RETURN NEW so auth.users insert always succeeds.
--   4. The app already gates on profiles.onboarding_completed; if profile is
--      missing for some odd reason, /onboarding will create one on submit.
--
-- Apply: paste into Supabase Dashboard → SQL Editor → Run.
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- profile row (UI state: locale, theme, onboarding flag)
  BEGIN
    INSERT INTO public.profiles (id) VALUES (new.id)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profiles insert failed for %: %', new.id, SQLERRM;
  END;

  -- users row (authorization: role, plan, terms acceptance)
  BEGIN
    INSERT INTO public.users (id, accepted_terms_at)
    VALUES (
      new.id,
      (new.raw_user_meta_data->>'accepted_terms_at')::TIMESTAMPTZ
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: users insert failed for %: %', new.id, SQLERRM;
  END;

  RETURN new;
END;
$$;

-- Trigger definition is unchanged — recreating for idempotency.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
