import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

async function syncTags(supabase: any, projectId: string, tagsInput: string | undefined) {
  if (tagsInput === undefined) return; // not provided — leave tags untouched
  const tags = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  await supabase.from("project_tags").delete().eq("project_id", projectId);
  if (tags.length > 0) {
    await supabase
      .from("project_tags")
      .insert(tags.map((tag) => ({ project_id: projectId, tag })));
  }
}

async function syncSkills(supabase: any, projectId: string, skillIds: string[] | undefined) {
  if (skillIds === undefined) return;
  await supabase.from("project_skills").delete().eq("project_id", projectId);
  if (skillIds.length > 0) {
    await supabase
      .from("project_skills")
      .insert(skillIds.map((skill_id) => ({ project_id: projectId, skill_id })));
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

  const { tags, skill_ids, ...projectFields } = body;

  const { data, error } = await supabase
    .from("projects")
    .update(projectFields)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await syncTags(supabase, id, tags);
  await syncSkills(supabase, id, skill_ids);

  return NextResponse.json({ project: data });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id } = await params;
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
