import { createAdminSupabase } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// Public route — no auth required. Uses the admin client to look up which
// file is current and stream it directly (no signed URL / redirect).
export async function GET() {
  const supabase = createAdminSupabase();

  const { data: current, error } = await supabase
    .from("resume_generations")
    .select("storage_path, label, created_at")
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
      // Temporary debug headers — tells us exactly what the server thinks
      // is "current" at the moment of the request. Remove once diagnosed.
      "X-Debug-Storage-Path": current.storage_path,
      "X-Debug-Label": encodeURIComponent(current.label ?? ""),
      "X-Debug-Created-At": current.created_at ?? "unknown",
      "X-Debug-Fetched-At": new Date().toISOString(),
    },
  });
}