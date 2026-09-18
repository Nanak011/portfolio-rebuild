import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await req.json();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("homepage_stats")
    .update({
      label: body.label,
      value: Number(body.value),
      max_value: Number(body.max_value) || 100,
      unit: body.unit || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ stat: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("homepage_stats").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
