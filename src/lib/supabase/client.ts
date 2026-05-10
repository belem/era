import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use implicit flow so confirmation links work in any browser/email client.
        // PKCE requires the code_verifier stored in the original browser session,
        // causing "otp_expired" when the link is opened in a different tab or webview.
        flowType: "implicit",
      },
    }
  );
}
