-- Fix: "permission denied for table users" when sending guardian invitations.
-- The original policy queried auth.users directly, which regular users cannot access.
-- Use auth.jwt() ->> 'email' instead to get the current user's email from the JWT token.

DROP POLICY IF EXISTS invitations_select_by_email ON guardian_invitations;

CREATE POLICY invitations_select_by_email ON guardian_invitations FOR SELECT
  USING (invited_email = (auth.jwt() ->> 'email'));
