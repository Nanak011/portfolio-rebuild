import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

const RETENTION_LIMIT = 10;

export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const supabase = createAdminSupabase();

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const label = (formData.get("label") as string) || `Uploaded — ${new Date().toISOString()}`;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const storagePath = `resumes/uploaded-${Date.now()}.pdf`;

  const { error: uploadErr } = await supabase.storage
    .from("resumes")
    .upload(storagePath, bytes, { contentType: "application/pdf" });
  if (uploadErr) {
    return NextResponse.json({ error: `Storage upload failed: ${uploadErr.message}` }, { status: 500 });
  }

  const { data: newRow, error: insertErr } = await supabase
    .from("resume_generations")
    .insert({ label, storage_path: storagePath, is_current: false })
    .select()
    .single();
  if (insertErr) {
    return NextResponse.json({ error: `DB insert failed: ${insertErr.message}` }, { status: 500 });
  }

  const { data: allRows } = await supabase
    .from("resume_generations")
    .select("id, storage_path, created_at")
    .order("created_at", { ascending: true });

  if (allRows && allRows.length > RETENTION_LIMIT) {
    const excess = allRows.slice(0, allRows.length - RETENTION_LIMIT);
    await supabase.storage.from("resumes").remove(excess.map((r) => r.storage_path));
    await supabase.from("resume_generations").delete().in("id", excess.map((r) => r.id));
  }

  return NextResponse.json({ ok: true, generation: newRow });
}