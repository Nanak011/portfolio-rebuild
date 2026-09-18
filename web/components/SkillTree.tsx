"use client";

import { useState } from "react";
import Link from "next/link";

type Skill = { id: string; name: string; sort_order: number };
type SkillGroup = { id: string; label: string; skills: Skill[] };
type ProjectLite = { id: string; slug: string; title: string; project_skills?: { skill_id: string }[] };
type ExperienceLite = {
  id: string;
  company: string;
  role_title: string;
  experience_skills?: { skill_id: string }[];
};

function findUsage(skillId: string, projects: ProjectLite[], experience: ExperienceLite[]) {
  const projectMatches = projects.filter((p) =>
    p.project_skills?.some((ps) => ps.skill_id === skillId)
  );
  const experienceMatches = experience.filter((e) =>
    e.experience_skills?.some((es) => es.skill_id === skillId)
  );
  return { projectMatches, experienceMatches };
}

function SkillRow({
  skill,
  projects,
  experience,
  isLast,
}: {
  skill: Skill;
  projects: ProjectLite[];
  experience: ExperienceLite[];
  isLast: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { projectMatches, experienceMatches } = findUsage(skill.id, projects, experience);
  const hasMatches = projectMatches.length > 0 || experienceMatches.length > 0;

  // No linked project/role for this skill yet — render it as a plain,
  // non-expandable line rather than a dead-end toggle.
  if (!hasMatches) {
    return (
      <div className="tree-node">
        <div className="tree-row" style={{ cursor: "default" }}>
          <span className="tree-branch">{isLast ? "└──" : "├──"}</span>
          <span className="tree-toggle"> </span>
          <span className="tree-label">{skill.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="tree-node">
      <button className="tree-row" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="tree-branch">{isLast ? "└──" : "├──"}</span>
        <span className="tree-toggle">{open ? "[-]" : "[+]"}</span>
        <span className="tree-label">{skill.name}</span>
      </button>

      {open && (
        <div className="tree-children">
          {projectMatches.map((p) => (
            <Link key={p.id} href={`/projects/${p.slug}`} className="tree-leaf">
              <span className="tree-branch">│&nbsp;&nbsp;&nbsp;└──</span>
              <span className="tree-leaf-label">project → {p.title}</span>
            </Link>
          ))}
          {experienceMatches.map((e) => (
            <div key={e.id} className="tree-leaf">
              <span className="tree-branch">│&nbsp;&nbsp;&nbsp;└──</span>
              <span className="tree-leaf-label">
                role → {e.company} ({e.role_title})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GroupNode({
  group,
  projects,
  experience,
}: {
  group: SkillGroup;
  projects: ProjectLite[];
  experience: ExperienceLite[];
}) {
  const [open, setOpen] = useState(true);
  const sorted = [...group.skills].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="tree-node">
      <button className="tree-row tree-root" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="tree-toggle">{open ? "[-]" : "[+]"}</span>
        <span className="tree-label root">{group.label.toUpperCase()}</span>
        <span className="tree-count">{sorted.length}</span>
      </button>

      {open && (
        <div className="tree-children">
          {sorted.map((skill, i) => (
            <SkillRow
              key={skill.id}
              skill={skill}
              projects={projects}
              experience={experience}
              isLast={i === sorted.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SkillTree({
  skillGroups,
  projects,
  experience,
}: {
  skillGroups: SkillGroup[];
  projects: ProjectLite[];
  experience: ExperienceLite[];
}) {
  return (
    <div className="tree">
      {skillGroups.map((g) => (
        <GroupNode key={g.id} group={g} projects={projects} experience={experience} />
      ))}
    </div>
  );
}
