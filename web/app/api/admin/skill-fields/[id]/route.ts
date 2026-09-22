import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function syncSkills(supabase: any, fieldId: string, skillIds: string[] | undefined) {
  if (skillIds === undefined) return;
  await supabase.from("skill_field_skills").delete().eq("field_id", fieldId);
  if (skillIds.length > 0) {
    await supabase
      .from("skill_field_skills")
      .insert(skillIds.map((skill_id) => ({ field_id: fieldId, skill_id })));
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const body = await req.json();
  const supabase = await createServerSupabase();

  const { skill_ids, ...fields } = body;

  const { data, error } = await supabase
    .from("skill_fields")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await syncSkills(supabase, id, skill_ids);

  return NextResponse.json({ field: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("skill_fields").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}