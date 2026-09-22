import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import SkillFieldMatrix from "@/components/SkillFieldMatrix";
import SkillTree from "@/components/SkillTree";
import HudDial from "@/components/HudDial";
import { OpenLockIcon } from "@/components/ProjectIcons";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createServerSupabase();

  const [
    { data: profile },
    { data: education },
    { data: experience },
    { data: skillGroups },
    { data: projectsForTree },
    { count: certCount },
    { data: extraSections },
    { data: stats },
    { data: certificationGroups },
    { data: skillFieldsRaw },
  ] = await Promise.all([
    supabase.from("profile").select("*").limit(1).single(),
    supabase.from("education").select("*, education_skills(skill_id)").order("sort_order"),
    supabase.from("experience").select("*, experience_bullets(*), experience_skills(skill_id)").order("sort_order"),
    supabase.from("skill_groups").select("*, skills(*)").order("sort_order"),
    supabase.from("projects").select("id, slug, title, project_skills(skill_id)").order("sort_order"),
    supabase.from("certifications").select("*", { count: "exact", head: true }),
    supabase.from("homepage_sections").select("*, homepage_entries(*)").order("sort_order"),
    supabase.from("homepage_stats").select("*").order("sort_order"),
    supabase.from("certification_groups").select("*, certifications(*)").order("sort_order"),
    supabase.from("skill_fields").select("*, skill_field_skills(skills(name))").order("sort_order"),
  ]);

  const projectCount = projectsForTree?.length ?? 0;
  const visibleSections = (extraSections ?? []).filter((s: any) => s.homepage_entries?.length > 0);
  const skillFields = (skillFieldsRaw ?? []).map((f: any) => ({
    id: f.id,
    label: f.label,
    percentage: f.percentage,
    skills: (f.skill_field_skills ?? []).map((s: any) => s.skills?.name).filter(Boolean),
  }));

  return (
    <main className="page">
      <div className="hud-bar">
        <div className="ticks">{Array.from({ length: 6 }).map((_, i) => <span key={i} />)}</div>
        <span className="hud-title">PORTFOLIO</span>
        <div className="ticks">{Array.from({ length: 6 }).map((_, i) => <span key={i} />)}</div>
      </div>

      <div className="hero">
        <div>
          <h1 className="hero-name">{profile?.full_name ?? "—"}</h1>
          <div className="hero-role">{profile?.location}</div>
          <p className="hero-summary">{profile?.summary}</p>
          {profile?.proof_statement && (
            <p
              style={{
                marginTop: 16,
                paddingLeft: 14,
                borderLeft: "2px solid var(--ink)",
                fontStyle: "italic",
                color: "var(--muted)",
                maxWidth: "56ch",
                fontSize: "0.88rem",
              }}
            >
              "{profile.proof_statement}"
            </p>
          )}
          <div className="chip-row">
            <a className="chip solid" href="/api/resume">
              ↓ RESUME.PDF
            </a>
            <Link className="chip" href="/projects">
              PROJECTS →
            </Link>
            <a className="chip" href={profile?.github_url} target="_blank">
              GITHUB
            </a>
            <a className="chip" href={profile?.linkedin_url} target="_blank">
              LINKEDIN
            </a>
          </div>
        </div>

        <div className="radar-wrap">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <SkillFieldMatrix fields={skillFields} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: 260 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: "0.8rem" }}>
                <span className="project-icon" style={{ width: 20, height: 20, margin: 0 }}>
                  <OpenLockIcon />
                </span>
                OPEN TO WORK
              </div>

              <div
                style={{
                  border: "1px solid var(--ink)",
                  padding: "8px 14px",
                  fontFamily: "var(--font-display), monospace",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                }}
              >
                PRJ {String(projectCount).padStart(2, "0")}
                <br />
                CRT {String(certCount ?? 0).padStart(2, "0")}
                <br />
                EXP {String(experience?.length ?? 0).padStart(2, "0")}
              </div>
            </div>
          </div>
        </div>
      </div>

      {stats && stats.length > 0 && (
        <div className="section">
          <div className="section-label">
            TELEMETRY <span className="rule" />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "flex-start" }}>
            {stats.map((s: any) => (
              <HudDial key={s.id} label={s.label} value={s.value} maxValue={s.max_value} unit={s.unit} />
            ))}
          </div>
        </div>
      )}

      <div className="section">
        <div className="section-label">
          EXPERIENCE <span className="rule" />
        </div>
        <div className="manifest">
          <div className="manifest-row manifest-head">
            <div>ORGANIZATION</div>
            <div>ROLE</div>
            <div>PERIOD</div>
          </div>
          {experience?.map((exp) => (
            <Link
              key={exp.id}
              href={`/experience/${exp.id}`}
              className="manifest-row"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div>{exp.company}</div>
              <div>{exp.role_title}</div>
              <div>
                {exp.start_date?.slice(0, 7)} → {exp.end_date?.slice(0, 7) ?? "now"}
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-label">
          EDUCATION <span className="rule" />
        </div>
        {education?.map((ed, i) => (
          <div key={ed.id} className="entry">
            <div className="entry-index">{String(i + 1).padStart(3, "0")}</div>
            <div>
              <div className="entry-head">
                <div>
                  <div className="entry-title">{ed.institution}</div>
                  <div className="entry-role">{ed.degree}</div>
                </div>
                <div className="entry-date">
                  {ed.start_date?.slice(0, 4)} – {ed.is_expected ? "EXPECTED " : ""}
                  {ed.end_date?.slice(0, 4) ?? ""}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="section">
        <div className="section-label">
          SKILLS <span className="rule" />
        </div>
        <SkillTree
          skillGroups={skillGroups ?? []}
          projects={projectsForTree ?? []}
          experience={experience ?? []}
          education={education ?? []}
        />
      </div>

      {certificationGroups && certificationGroups.length > 0 && (
        <div className="section">
          <div className="section-label">
            CERTIFICATIONS <span className="rule" />
          </div>
          {certificationGroups.map((g: any) => (
            <div key={g.id} className="certification-entry">
              <div className="entry-title">{g.label}</div>
              <div className="certification-list">
                {g.certifications
                  ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
                  .map((c: any) => (
                    <div key={c.id} className="entry-role" style={{ marginBottom: 4 }}>
                      {c.credential_url ? (
                        <a href={c.credential_url} target="_blank">
                          {c.issuer ? `${c.issuer}: ${c.name}` : c.name}
                        </a>
                      ) : c.issuer ? (
                        `${c.issuer}: ${c.name}`
                      ) : (
                        c.name
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {visibleSections.map((s: any) => (
        <div key={s.id} className="section">
          <div className="section-label">
            {s.label.toUpperCase()} <span className="rule" />
          </div>
          <div className="manifest">
            <div className="manifest-row manifest-head">
              <div>TITLE</div>
              <div>DETAIL</div>
              <div>DATE</div>
            </div>
            {s.homepage_entries
              .sort((a: any, b: any) => a.sort_order - b.sort_order)
              .map((entry: any) => (
                <div key={entry.id} className="manifest-row">
                  <div>
                    {entry.url ? (
                      <a href={entry.url} target="_blank">
                        {entry.title}
                      </a>
                    ) : (
                      entry.title
                    )}
                  </div>
                  <div>{entry.description}</div>
                  <div>{entry.entry_date ?? "—"}</div>
                </div>
              ))}
          </div>
        </div>
      ))}

      <div className="footer-strip">
        <span>
          <b>EMAIL:</b> <a href={`mailto:${profile?.email}`}>{profile?.email}</a>
        </span>
        <span>
          <b>PHONE:</b> {profile?.phone}
        </span>
      </div>
    </main>
  );
}