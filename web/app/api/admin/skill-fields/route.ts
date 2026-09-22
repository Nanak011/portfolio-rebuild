import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("skill_fields")
    .select("*, skill_field_skills(skill_id)")
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ fields: data });
}

async function syncSkills(supabase: any, fieldId: string, skillIds: string[] | undefined) {
  if (skillIds === undefined) return;
  await supabase.from("skill_field_skills").delete().eq("field_id", fieldId);
  if (skillIds.length > 0) {
    await supabase
      .from("skill_field_skills")
      .insert(skillIds.map((skill_id) => ({ field_id: fieldId, skill_id })));
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("skill_fields")
    .insert({
      label: body.label,
      percentage: body.percentage ?? 50,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await syncSkills(supabase, data.id, body.skill_ids);

  return NextResponse.json({ field: data });
}