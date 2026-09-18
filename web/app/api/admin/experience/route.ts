import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("experience")
    .select("*, experience_bullets(*), experience_skills(skill_id)")
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ experience: data });
}

async function syncSkills(supabase: any, experienceId: string, skillIds: string[] | undefined) {
  if (skillIds === undefined) return;
  await supabase.from("experience_skills").delete().eq("experience_id", experienceId);
  if (skillIds.length > 0) {
    await supabase
      .from("experience_skills")
      .insert(skillIds.map((skill_id) => ({ experience_id: experienceId, skill_id })));
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("experience")
    .insert({
      company: body.company,
      location: body.location ?? null,
      role_title: body.role_title,
      employment_type: body.employment_type ?? null,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await syncSkills(supabase, data.id, body.skill_ids);

  return NextResponse.json({ experience: data });
}
