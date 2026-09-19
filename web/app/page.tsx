import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import RadarInstrument from "@/components/RadarInstrument";
import SkillTree from "@/components/SkillTree";
import { OpenLockIcon } from "@/components/ProjectIcons";
import HudDial from "@/components/HudDial";

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
  ] = await Promise.all([
    supabase.from("profile").select("*").limit(1).single(),
    supabase.from("education").select("*, education_skills(skill_id)").order("sort_order"),
    supabase.from("experience").select("*, experience_bullets(*), experience_skills(skill_id)").order("sort_order"),
    supabase.from("skill_groups").select("*, skills(*)").order("sort_order"),
    supabase.from("projects").select("id, slug, title, project_skills(skill_id)").order("sort_order"),
    supabase.from("certifications").select("*", { count: "exact", head: true }),
    supabase
      .from("homepage_sections")
      .select("*, homepage_entries(*)")
      .order("sort_order"),
    supabase.from("homepage_stats").select("*").order("sort_order"),
    supabase.from("certification_groups").select("*, certifications(*)").order("sort_order"),
  ]);

  const projectCount = projectsForTree?.length ?? 0;
  const visibleSections = (extraSections ?? []).filter(
    (s: any) => s.homepage_entries?.length > 0
  );

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
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <RadarInstrument
              projects={projectCount}
              certs={certCount ?? 0}
              roles={experience?.length ?? 0}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: "0.7rem" }}>
              <span className="project-icon" style={{ width: 20, height: 20, margin: 0 }}>
                <OpenLockIcon />
              </span>
              OPEN TO WORK
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
            <div key={exp.id} className="manifest-row">
              <div>{exp.company}</div>
              <div>{exp.role_title}</div>
              <div>{exp.start_date?.slice(0, 7)} → {exp.end_date?.slice(0, 7) ?? "now"}</div>
            </div>
          ))}
        </div>

        {experience?.map((exp, i) => (
          <div key={exp.id} className="entry">
            <div className="entry-index">{String(i + 1).padStart(3, "0")}</div>
            <div>
              <div className="entry-head">
                <div>
                  <div className="entry-title">
                    {exp.company} — {exp.role_title}
                  </div>
                  <div className="entry-role">{exp.employment_type}</div>
                </div>
                <div className="entry-date">
                  {exp.start_date} – {exp.end_date ?? "PRESENT"}
                </div>
              </div>
              <ul>
                {exp.experience_bullets
                  ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
                  .map((b: any) => (
                    <li key={b.id}>{b.content}</li>
                  ))}
              </ul>
            </div>
          </div>
        ))}
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
              <div className="entry-role certification-list">
                {g.certifications
                  ?.sort((a: any, b: any) => a.sort_order - b.sort_order)
                  .map((c: any, i: number) => (
                    <span key={c.id} className="certification-item">
                      {c.credential_url ? (
                        <a href={c.credential_url} target="_blank">
                          {c.issuer ? `${c.issuer}: ${c.name}` : c.name}
                        </a>
                      ) : c.issuer ? (
                        `${c.issuer}: ${c.name}`
                      ) : (
                        c.name
                      )}
                    </span>
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
        <span><b>EMAIL:</b> {profile?.email}</span>
        <span><b>PHONE:</b> {profile?.phone}</span>
      </div>
    </main>
  );
}
