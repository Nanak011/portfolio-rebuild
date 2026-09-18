import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side client — respects the logged-in user's session (RLS applies).
// Use this for anything that should be scoped to "am I authenticated or not".
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component without write access — safe to ignore
            // because middleware refreshes the session on every request anyway.
          }
        },
      },
    }
  );
}
