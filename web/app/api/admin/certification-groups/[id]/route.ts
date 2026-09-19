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
    .from("certification_groups")
    .update({ label: body.label })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ group: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = await createServerSupabase();
  // certifications.certification_group_id has ON DELETE CASCADE
  const { error } = await supabase.from("certification_groups").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
