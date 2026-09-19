import { requireAdmin } from "@/lib/supabase/requireAdmin";
import { NextRequest, NextResponse } from "next/server";

// This route does NOT compile anything itself. It just authenticates the
// admin request, then forwards a single trusted call to the Fly.io
// pdf-service, which is the only place tectonic runs.
export async function POST(req: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const { label, sections, order, itemSelection } = await req.json().catch(() => ({
    label: undefined,
    sections: undefined,
    order: undefined,
    itemSelection: undefined,
  }));

  const pdfServiceUrl = process.env.PDF_SERVICE_URL; // e.g. https://portfolio-pdf-service.fly.dev
  const pdfServiceSecret = process.env.PDF_SERVICE_SECRET;

  if (!pdfServiceUrl || !pdfServiceSecret) {
    return NextResponse.json(
      { error: "PDF_SERVICE_URL / PDF_SERVICE_SECRET not configured" },
      { status: 500 }
    );
  }

  const res = await fetch(`${pdfServiceUrl}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-secret": pdfServiceSecret,
    },
    body: JSON.stringify({ label, sections, order, itemSelection }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    return NextResponse.json(
      { error: body.error ?? "PDF generation failed" },
      { status: res.status }
    );
  }

  return NextResponse.json(body);
}
