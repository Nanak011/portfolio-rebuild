import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { ShieldIcon, NetworkIcon, TerminalIcon, LockIcon } from "@/components/ProjectIcons";

export const revalidate = 60;

const ICON_MAP: Record<string, () => JSX.Element> = {
  shield: ShieldIcon,
  network: NetworkIcon,
  terminal: TerminalIcon,
  lock: LockIcon,
};

export default async function ProjectsPage() {
  const supabase = await createServerSupabase();
  const { data: projects } = await supabase
    .from("projects")
    .select("*, project_tags(*)")
    .order("sort_order");

  return (
    <main className="page">
      <p>
        <Link href="/" className="chip" style={{ display: "inline-block" }}>
          ⌂ HOME
        </Link>
      </p>
      <div className="section" style={{ marginTop: 8 }}>
        <div className="section-label">
          PROJECTS <span className="rule" />
        </div>
        <div className="project-grid">
          {projects?.map((p) => {
            const Icon = ICON_MAP[p.icon] ?? ShieldIcon;
            return (
              <div key={p.id} className="project-card">
                <div className="project-icon">
                  <Icon />
                </div>
                <h3>
                  <Link href={`/projects/${p.slug}`}>{p.title}</Link>
                </h3>
                <p>{p.problem}</p>
                <div>
                  {p.is_flagship && <span className="tag solid">FLAGSHIP</span>}
                  {p.project_tags?.map((t: any) => (
                    <span key={t.id} className="tag">
                      {t.tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
