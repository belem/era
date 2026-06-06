import { Resend } from "resend";

const FROM_DEFAULT = "Kuibu <noreply@kuibu.app>";

type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  /** Plain-text fallback. Recommended for deliverability. */
  text?: string;
  /** Override the From: header. Defaults to RESEND_FROM_EMAIL or noreply@kuibu.app. */
  from?: string;
  /** Reply-To, e.g. for invites where the sender wants replies. */
  replyTo?: string;
};

type SendResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

let cached: Resend | null = null;

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (cached) return cached;
  cached = new Resend(key);
  return cached;
}

/**
 * Send a transactional email via Resend. Returns {ok:false} (never throws) so
 * callers can decide what to do — e.g. an invitation insert that succeeds but
 * whose email fails should still report success to the inviter, not 500.
 *
 * Supabase auth emails (signup confirmation, magic link, password reset) do
 * NOT go through this function — they are sent by Supabase's SMTP pipeline,
 * which is configured in the Supabase dashboard.
 */
export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const client = getClient();
  if (!client) return { ok: false, error: "RESEND_API_KEY not set" };

  const from = args.from ?? process.env.RESEND_FROM_EMAIL ?? FROM_DEFAULT;

  const { data, error } = await client.emails.send({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    ...(args.text ? { text: args.text } : {}),
    ...(args.replyTo ? { replyTo: args.replyTo } : {}),
  });

  if (error) return { ok: false, error: error.message ?? "Resend error" };
  if (!data?.id) return { ok: false, error: "Resend returned no message id" };
  return { ok: true, id: data.id };
}
