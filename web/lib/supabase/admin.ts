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
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
