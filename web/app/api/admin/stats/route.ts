import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("homepage_stats").select("*").order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stats: data });
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("homepage_stats")
    .insert({
      label: body.label,
      value: Number(body.value),
      max_value: Number(body.max_value) || 100,
      unit: body.unit || null,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stat: data });
}
