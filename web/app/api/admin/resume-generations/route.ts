import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// Uses the admin (service role) client because resume_generations has no
// public/authenticated RLS read policy for the browser session — only this
// trusted server route touches it directly.
export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from("resume_generations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ generations: data });
}

// Body: { id: string, action: "set_current" | "delete" }
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { id, action } = await req.json();
  const supabase = createAdminSupabase();

  if (action === "set_current") {
    // Unset any existing current, then set this one — matches the
    // "only one row true at a time" unique index in the schema.
    await supabase.from("resume_generations").update({ is_current: false }).eq("is_current", true);
    const { error } = await supabase
      .from("resume_generations")
      .update({ is_current: true })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    const { data: row } = await supabase
      .from("resume_generations")
      .select("storage_path")
      .eq("id", id)
      .single();

    if (row) {
      await supabase.storage.from("resumes").remove([row.storage_path]);
    }
    const { error } = await supabase.from("resume_generations").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "flush_all") {
    const { data: rows } = await supabase.from("resume_generations").select("id, storage_path");
    if (rows && rows.length > 0) {
      await supabase.storage.from("resumes").remove(rows.map((r) => r.storage_path));
      await supabase.from("resume_generations").delete().in(
        "id",
        rows.map((r) => r.id)
      );
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "get_url") {
    const { data: row } = await supabase
      .from("resume_generations")
      .select("storage_path")
      .eq("id", id)
      .single();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { data: signed, error: signError } = await supabase.storage
      .from("resumes")
      .createSignedUrl(row.storage_path, 300);

    if (signError || !signed) {
      return NextResponse.json({ error: signError?.message ?? "Could not sign URL" }, { status: 500 });
    }

    return NextResponse.json({ url: signed.signedUrl });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
