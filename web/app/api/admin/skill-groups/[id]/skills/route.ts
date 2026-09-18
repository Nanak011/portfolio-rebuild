import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id: groupId } = await params;
  const body = await req.json();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("skills")
    .insert({ skill_group_id: groupId, name: body.name, sort_order: body.sort_order ?? 0 })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ skill: data });
}
