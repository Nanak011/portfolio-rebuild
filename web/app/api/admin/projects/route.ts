import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select("*, project_tags(*), project_skills(skill_id), project_links(*)")
    .order("sort_order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects: data });
}

// body.tags: comma-separated string, e.g. "AWS, Lambda, WAF" — fully replaces
// this project's tags on save.
async function syncTags(supabase: any, projectId: string, tagsInput: string | undefined) {
  const tags = (tagsInput ?? "")
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

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const body = await req.json();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      title: body.title,
      slug: body.slug,
      is_flagship: body.is_flagship ?? false,
      icon: body.icon || "shield",
      problem: body.problem,
      what_i_did: body.what_i_did,
      what_came_of_it: body.what_came_of_it,
      repo_url: body.repo_url ?? null,
      demo_url: body.demo_url ?? null,
      include_in_resume: body.include_in_resume ?? true,  
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await syncTags(supabase, data.id, body.tags);
  await syncSkills(supabase, data.id, body.skill_ids);

  return NextResponse.json({ project: data });
}
