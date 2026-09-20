import { createClient } from "@supabase/supabase-js";

// DANGER: this bypasses Row Level Security entirely.
// Only import this inside API routes AFTER you've verified
// the caller is the authenticated admin (see requireAdmin() below).
// Never import this in a client component or expose the service role key
// to the browser.
export function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        // Force every request this client makes (both REST queries and
        // Storage downloads) to bypass Next.js's fetch cache entirely.
        // Routes that call cookies() get this for free automatically;
        // routes that don't (like the public resume download, which is
        // intentionally unauthenticated) need it set explicitly here,
        // or Next.js can serve a stale cached response from a previous
        // request even with `export const dynamic = "force-dynamic"` set.
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          fetch(input, { ...init, cache: "no-store" }),
      },
    }
  );
}