import { createServerSupabase } from "./server";

// Call this at the top of any admin-only API route.
// Throws-by-return-value pattern: returns null if authenticated, otherwise
// a Response you should return immediately.
export async function requireAdmin() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null; // caller is authenticated, proceed
}
