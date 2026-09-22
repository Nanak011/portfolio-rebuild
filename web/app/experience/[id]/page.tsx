import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

function formatDate(d: string | null, current: boolean) {
  if (!d) return current ? "PRESENT" : "";
  return d.slice(0, 7);
}

export default async function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: exp } = await supabase
    .from("experience")
    .select("*, experience_bullets(*)")
    .eq("id", id)
    .single();

  if (!exp) notFound();

  return (
    <main className="page">
      <p style={{ display: "flex", gap: 10 }}>
        <Link href="/" className="chip">
          ⌂ HOME
        </Link>
      </p>

      <div className="panel" style={{ marginTop: 16 }}>
        <h1 className="hero-name" style={{ fontSize: "1.5rem" }}>
          {exp.company_url ? (
            <a href={exp.company_url} target="_blank">
              {exp.company}
            </a>
          ) : (
            exp.company
          )}
        </h1>
        <div className="hero-role" style={{ marginTop: 6 }}>
          {exp.role_title}
          {exp.employment_type ? ` (${exp.employment_type})` : ""}
        </div>
        <div className="entry-date" style={{ marginTop: 6 }}>
          {formatDate(exp.start_date, false)} – {formatDate(exp.end_date, true)}
        </div>

        <div className="section">
          <div className="section-label">
            DETAILS <span className="rule" />
          </div>
          <ul style={{ paddingLeft: 18, lineHeight: 1.75, fontSize: "0.9rem" }}>
            {exp.experience_bullets
              ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((b: any) => (
                <li key={b.id}>{b.content}</li>
              ))}
          </ul>
        </div>

        {exp.company_url && (
          <div className="chip-row">
            <a className="chip" href={exp.company_url} target="_blank">
              VISIT {exp.company.toUpperCase()} →
            </a>
          </div>
        )}
      </div>
    </main>
  );
}