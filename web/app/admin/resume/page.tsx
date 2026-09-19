"use client";

import { useEffect, useState } from "react";

type Generation = {
  id: string;
  created_at: string;
  label: string;
  storage_path: string;
  is_current: boolean;
};

const SECTION_LABELS: Record<string, string> = {
  education: "Education",
  experience: "Experience",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
};
const DEFAULT_ORDER = ["education", "experience", "skills", "projects", "certifications"];

type Item = { id: string; label: string };

function PickerBlock({
  title,
  items,
  selected,
  onToggle,
  onSelectAll,
  onSelectNone,
}: {
  title: string;
  items: Item[];
  selected: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <div className="project-card" style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button type="button" onClick={() => setOpen((v) => !v)} style={{ boxShadow: "none" }}>
          {open ? "▾" : "▸"} {title} ({selected.length}/{items.length} included)
        </button>
        {open && (
          <div>
            <button type="button" onClick={onSelectAll}>all</button>{" "}
            <button type="button" onClick={onSelectNone}>none</button>
          </div>
        )}
      </div>
      {open && (
        <div className="section" style={{ marginTop: 10 }}>
          {items.map((item) => (
            <label key={item.id} style={{ display: "block", fontSize: "0.85rem", marginTop: 6 }}>
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => onToggle(item.id)}
                style={{ width: "auto", marginRight: 8 }}
              />
              {item.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminResumePage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [label, setLabel] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<string, boolean>>(
    Object.fromEntries(DEFAULT_ORDER.map((s) => [s, true]))
  );
  const [order, setOrder] = useState<string[]>(DEFAULT_ORDER);
  const [extraLabels, setExtraLabels] = useState<Record<string, string>>({});

  // Item-picker data + selections
  const [educationItems, setEducationItems] = useState<Item[]>([]);
  const [experienceItems, setExperienceItems] = useState<Item[]>([]);
  const [projectItems, setProjectItems] = useState<Item[]>([]);
  const [skillItems, setSkillItems] = useState<Item[]>([]);
  const [certItems, setCertItems] = useState<Item[]>([]);
  const [entryItems, setEntryItems] = useState<Item[]>([]);

  const [selEducation, setSelEducation] = useState<string[]>([]);
  const [selExperience, setSelExperience] = useState<string[]>([]);
  const [selProjects, setSelProjects] = useState<string[]>([]);
  const [selSkills, setSelSkills] = useState<string[]>([]);
  const [selCerts, setSelCerts] = useState<string[]>([]);
  const [selEntries, setSelEntries] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/resume-generations");
    const json = await res.json();
    setGenerations(json.generations ?? []);
    setLoading(false);
  }

  async function loadExtraSections() {
    const res = await fetch("/api/admin/sections");
    const json = await res.json();
    const withEntries = (json.sections ?? []).filter((s: any) => s.homepage_entries?.length > 0);
    if (withEntries.length > 0) {
      const extraKeys = withEntries.map((s: any) => `extra_${s.slug}`);
      const labels = Object.fromEntries(withEntries.map((s: any) => [`extra_${s.slug}`, s.label]));
      setExtraLabels(labels);
      setOrder((prev) => [...prev, ...extraKeys.filter((k: string) => !prev.includes(k))]);
      setSections((prev) => ({
        ...Object.fromEntries(extraKeys.map((k: string) => [k, true])),
        ...prev,
      }));
    }
    const allEntries: Item[] = [];
    withEntries.forEach((s: any) => {
      s.homepage_entries.forEach((e: any) => {
        allEntries.push({ id: e.id, label: `[${s.label}] ${e.title}` });
      });
    });
    setEntryItems(allEntries);
    setSelEntries(allEntries.map((e) => e.id));
  }

  async function loadPickerData() {
    const [eduRes, expRes, projRes, skillRes, certRes] = await Promise.all([
      fetch("/api/admin/education"),
      fetch("/api/admin/experience"),
      fetch("/api/admin/projects"),
      fetch("/api/admin/skill-groups"),
      fetch("/api/admin/certification-groups"),
    ]);
    const eduJson = await eduRes.json();
    const expJson = await expRes.json();
    const projJson = await projRes.json();
    const skillJson = await skillRes.json();
    const certJson = await certRes.json();

    const edu = (eduJson.education ?? []).map((e: any) => ({ id: e.id, label: e.institution, include: e.include_in_resume }));
    setEducationItems(edu.map(({ id, label }: any) => ({ id, label })));
    setSelEducation(edu.filter((e: any) => e.include !== false).map((e: any) => e.id));

    const exp = (expJson.experience ?? []).map((e: any) => ({ id: e.id, label: `${e.company} — ${e.role_title}`, include: e.include_in_resume }));
    setExperienceItems(exp.map(({ id, label }: any) => ({ id, label })));
    setSelExperience(exp.filter((e: any) => e.include !== false).map((e: any) => e.id));

    const proj = (projJson.projects ?? []).map((p: any) => ({ id: p.id, label: p.title, include: p.include_in_resume }));
    setProjectItems(proj.map(({ id, label }: any) => ({ id, label })));
    setSelProjects(proj.filter((p: any) => p.include !== false).map((p: any) => p.id));

    const skills: Item[] = [];
    (skillJson.groups ?? []).forEach((g: any) => {
      g.skills.forEach((s: any) => skills.push({ id: s.id, label: `[${g.label}] ${s.name}` }));
    });
    setSkillItems(skills);
    setSelSkills(skills.map((s) => s.id));

    const certs: Item[] = [];
    (certJson.groups ?? []).forEach((g: any) => {
      g.certifications.forEach((c: any) => certs.push({ id: c.id, label: `[${g.label}] ${c.name}` }));
    });
    setCertItems(certs);
    setSelCerts(certs.map((c) => c.id));
  }

  useEffect(() => {
    load();
    loadExtraSections();
    loadPickerData();
  }, []);

  function toggleSection(key: string) {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function moveSection(index: number, direction: -1 | 1) {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function toggleIn(list: string[], id: string, setter: (v: string[]) => void) {
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function handleGenerate() {
    setGenerating(true);
    setMessage(null);
    const res = await fetch("/api/admin/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: label || undefined,
        sections,
        order,
        itemSelection: {
          educationIds: selEducation,
          experienceIds: selExperience,
          projectIds: selProjects,
          skillIds: selSkills,
          certificationIds: selCerts,
          entryIds: selEntries,
        },
      }),
    });
    const json = await res.json();
    setGenerating(false);
    if (!res.ok) {
      setMessage(`Error: ${json.error}`);
      return;
    }
    setMessage("Generated successfully.");
    setLabel("");
    load();
  }

  async function handleAction(id: string, action: "set_current" | "delete") {
    if (action === "delete" && !confirm("Delete this generation permanently?")) return;
    await fetch("/api/admin/resume-generations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    load();
  }

  async function handleView(id: string) {
    const res = await fetch("/api/admin/resume-generations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action: "get_url" }),
    });
    const json = await res.json();
    if (json.url) {
      window.open(json.url, "_blank");
    } else {
      alert(json.error ?? "Could not get a download link.");
    }
  }

  async function handleFlush() {
    if (!confirm("Delete ALL resume generation history? This cannot be undone.")) return;
    await fetch("/api/admin/resume-generations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "flush_all" }),
    });
    load();
  }

  return (
    <main>
      <h1>Resume Generation</h1>

      <div className="section">
        <label>
          Label (optional — defaults to timestamp)
          <input value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>

        <div style={{ marginTop: 16 }}>
          <div className="muted" style={{ fontSize: "0.8rem", marginBottom: 8 }}>
            Sections — check to include, arrows to reorder (top = first in the PDF):
          </div>
          {order.map((key, i) => (
            <div
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 0",
                borderBottom: "1px solid var(--line-soft)",
              }}
            >
              <input
                type="checkbox"
                checked={sections[key]}
                onChange={() => toggleSection(key)}
                style={{ width: "auto" }}
              />
              <span style={{ flex: 1 }}>{SECTION_LABELS[key] ?? extraLabels[key] ?? key}</span>
              <button type="button" onClick={() => moveSection(i, -1)} disabled={i === 0} style={{ padding: "2px 8px" }}>
                ↑
              </button>
              <button type="button" onClick={() => moveSection(i, 1)} disabled={i === order.length - 1} style={{ padding: "2px 8px" }}>
                ↓
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 20 }}>
          <div className="muted" style={{ fontSize: "0.8rem", marginBottom: 8 }}>
            Within each included section, pick exactly which items go in THIS PDF (doesn't change each item's permanent "include in resume" setting):
          </div>
          <PickerBlock
            title="Education"
            items={educationItems}
            selected={selEducation}
            onToggle={(id) => toggleIn(selEducation, id, setSelEducation)}
            onSelectAll={() => setSelEducation(educationItems.map((i) => i.id))}
            onSelectNone={() => setSelEducation([])}
          />
          <PickerBlock
            title="Experience"
            items={experienceItems}
            selected={selExperience}
            onToggle={(id) => toggleIn(selExperience, id, setSelExperience)}
            onSelectAll={() => setSelExperience(experienceItems.map((i) => i.id))}
            onSelectNone={() => setSelExperience([])}
          />
          <PickerBlock
            title="Projects"
            items={projectItems}
            selected={selProjects}
            onToggle={(id) => toggleIn(selProjects, id, setSelProjects)}
            onSelectAll={() => setSelProjects(projectItems.map((i) => i.id))}
            onSelectNone={() => setSelProjects([])}
          />
          <PickerBlock
            title="Skills"
            items={skillItems}
            selected={selSkills}
            onToggle={(id) => toggleIn(selSkills, id, setSelSkills)}
            onSelectAll={() => setSelSkills(skillItems.map((i) => i.id))}
            onSelectNone={() => setSelSkills([])}
          />
          <PickerBlock
            title="Certifications"
            items={certItems}
            selected={selCerts}
            onToggle={(id) => toggleIn(selCerts, id, setSelCerts)}
            onSelectAll={() => setSelCerts(certItems.map((i) => i.id))}
            onSelectNone={() => setSelCerts([])}
          />
          <PickerBlock
            title="Additional sections"
            items={entryItems}
            selected={selEntries}
            onToggle={(id) => toggleIn(selEntries, id, setSelEntries)}
            onSelectAll={() => setSelEntries(entryItems.map((i) => i.id))}
            onSelectNone={() => setSelEntries([])}
          />
        </div>

        <button onClick={handleGenerate} disabled={generating} style={{ marginTop: 16 }}>
          {generating ? "Compiling with tectonic..." : "Generate PDF"}
        </button>
        {message && <p className="muted">{message}</p>}
      </div>

      <h2>History (rolling window of 10)</h2>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : (
        generations.map((g) => (
          <div key={g.id} className="project-card">
            <strong>{g.label}</strong>{" "}
            {g.is_current && <span className="tag solid">CURRENT</span>}
            <div className="muted">{new Date(g.created_at).toLocaleString()}</div>
            <div className="section">
              <button onClick={() => handleView(g.id)}>view / download</button>{" "}
              {!g.is_current && (
                <button onClick={() => handleAction(g.id, "set_current")}>
                  set as current
                </button>
              )}{" "}
              <button onClick={() => handleAction(g.id, "delete")}>delete</button>
            </div>
          </div>
        ))
      )}

      {generations.length > 0 && (
        <button className="section" onClick={handleFlush}>
          flush all history
        </button>
      )}
    </main>
  );
}
