import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id: sectionId } = await params;
  const body = await req.json();
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("homepage_entries")
    .insert({
      section_id: sectionId,
      title: body.title,
      description: body.description ?? null,
      url: body.url ?? null,
      entry_date: body.entry_date || null,
      sort_order: body.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}
