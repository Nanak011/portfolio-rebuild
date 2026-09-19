import { createAdminSupabase } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Public route — no auth required. Uses the admin client ONLY to look up
// which file is current and generate a short-lived signed URL; it never
// exposes write access or any other table to the visitor.
export async function GET() {
  const supabase = createAdminSupabase();

  const { data: current, error } = await supabase
    .from("resume_generations")
    .select("storage_path, label")
    .eq("is_current", true)
    .single();

  if (error || !current) {
    return NextResponse.json(
      { error: "No current resume has been generated yet." },
      { status: 404 }
    );
  }

  const { data: pdf, error: downloadError } = await supabase.storage
    .from("resumes")
    .download(current.storage_path);

  if (downloadError || !pdf) {
    return NextResponse.json(
      { error: "Could not download the current resume." },
      { status: 500 }
    );
  }

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="resume.pdf"',
      "Cache-Control": "private, no-store, max-age=0, must-revalidate",
    },
  });
}
