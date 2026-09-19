import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("certification_groups")
    .select("*, certifications(*)")
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ groups: data });
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("certification_groups")
    .insert({ label: body.label, sort_order: body.sort_order ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ group: data });
}
