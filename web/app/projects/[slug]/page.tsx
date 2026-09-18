import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const { data: project } = await supabase
    .from("projects")
    .select("*, project_tags(*), project_links(*)")
    .eq("slug", slug)
    .single();

  if (!project) notFound();

  return (
    <main className="page">
      <p style={{ display: "flex", gap: 10 }}>
        <Link href="/" className="chip" style={{ display: "inline-block" }}>
          ⌂ HOME
        </Link>
        <Link href="/projects" className="chip" style={{ display: "inline-block" }}>
          &larr; ALL PROJECTS
        </Link>
      </p>

      <div className="panel" style={{ marginTop: 16 }}>
        <h1 className="hero-name" style={{ fontSize: "1.5rem" }}>
          {project.title}
        </h1>
        <div style={{ marginTop: 12 }}>
          {project.is_flagship && <span className="tag solid">FLAGSHIP</span>}
          {project.project_tags?.map((t: any) => (
            <span key={t.id} className="tag">
              {t.tag}
            </span>
          ))}
        </div>

        <div className="section">
          <div className="section-label">
            PROBLEM <span className="rule" />
          </div>
          <p style={{ lineHeight: 1.75, fontSize: "0.9rem" }}>{project.problem}</p>
        </div>

        <div className="section">
          <div className="section-label">
            WHAT I DID <span className="rule" />
          </div>
          <p style={{ lineHeight: 1.75, fontSize: "0.9rem" }}>{project.what_i_did}</p>
        </div>

        <div className="section">
          <div className="section-label">
            WHAT CAME OF IT <span className="rule" />
          </div>
          <p style={{ lineHeight: 1.75, fontSize: "0.9rem" }}>{project.what_came_of_it}</p>
        </div>

        <div className="chip-row">
          {project.repo_url && (
            <a className="chip" href={project.repo_url} target="_blank">
              REPO →
            </a>
          )}
          {project.demo_url && (
            <a className="chip" href={project.demo_url} target="_blank">
              DEMO →
            </a>
          )}
          {project.project_links?.map((l: any) => (
            <a key={l.id} className="chip" href={l.url} target="_blank">
              {l.label.toUpperCase()} →
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
