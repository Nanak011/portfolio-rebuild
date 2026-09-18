import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("profile").select("*").limit(1).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

export async function PATCH(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const supabase = await createServerSupabase();

  // Single-row table — fetch the id first rather than requiring the client to know it.
  const { data: existing, error: findErr } = await supabase
    .from("profile")
    .select("id")
    .limit(1)
    .single();
  if (findErr) return NextResponse.json({ error: findErr.message }, { status: 500 });

  const { data, error } = await supabase
    .from("profile")
    .update({
      full_name: body.full_name,
      location: body.location,
      phone: body.phone,
      email: body.email,
      linkedin_url: body.linkedin_url,
      github_url: body.github_url,
      summary: body.summary,
      proof_statement: body.proof_statement,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
