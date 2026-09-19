import { createAdminSupabase } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
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

  const { data: signed, error: signError } = await supabase.storage
    .from("resumes")
    .createSignedUrl(current.storage_path, 300); // 5-minute window — avoids expiry races over slow connections

  if (signError || !signed) {
    return NextResponse.json(
      { error: "Could not create download link." },
      { status: 500 }
    );
  }

  return NextResponse.redirect(signed.signedUrl, {
    headers: {
      "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
      Expires: "0",
    },
  });
}
