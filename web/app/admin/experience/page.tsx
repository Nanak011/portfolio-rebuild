"use client";

import { useEffect, useState } from "react";

type Bullet = { id: string; content: string; sort_order: number };
type ExperienceItem = {
  id: string;
  company: string;
  company_url: string | null;
  location: string | null;
  role_title: string;
  employment_type: string | null;
  start_date: string | null;
  end_date: string | null;
  include_in_resume: boolean;
  sort_order: number;
  experience_bullets?: Bullet[];
  experience_skills?: { skill_id: string }[];
};
type Skill = { id: string; name: string };
type SkillGroup = { id: string; label: string; skills: Skill[] };

const emptyForm = {
  company: "",
  company_url: "",
  location: "",
  role_title: "",
  employment_type: "",
  start_date: "",
  end_date: "",
  include_in_resume: true,
  sort_order: 0,
  skill_ids: [] as string[],
};

export default function AdminExperiencePage() {
  const [items, setItems] = useState<ExperienceItem[]>([]);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBullet, setNewBullet] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const [expRes, skillRes] = await Promise.all([
      fetch("/api/admin/experience"),
      fetch("/api/admin/skill-groups"),
    ]);
    const expJson = await expRes.json();
    const skillJson = await skillRes.json();
    setItems(expJson.experience ?? []);
    setSkillGroups(skillJson.groups ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(item: ExperienceItem) {
    setEditingId(item.id);
    setForm({
      company: item.company,
      company_url: item.company_url ?? "",
      location: item.location ?? "",
      role_title: item.role_title,
      employment_type: item.employment_type ?? "",
      start_date: item.start_date ?? "",
      end_date: item.end_date ?? "",
      sort_order: item.sort_order,
      include_in_resume: item.include_in_resume,
      skill_ids: (item.experience_skills ?? []).map((s) => s.skill_id),
    });
  }

  function startNew() {
    setEditingId("new");
    setForm(emptyForm);
  }

  function toggleSkill(skillId: string) {
    setForm((prev) => ({
      ...prev,
      skill_ids: prev.skill_ids.includes(skillId)
        ? prev.skill_ids.filter((id) => id !== skillId)
        : [...prev.skill_ids, skillId],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (editingId === "new") {
      await fetch("/api/admin/experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else if (editingId) {
      await fetch(`/api/admin/experience/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }
    setSaving(false);
    setEditingId(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this experience entry and all its bullets?")) return;
    await fetch(`/api/admin/experience/${id}`, { method: "DELETE" });
    load();
  }

  async function handleAddBullet(experienceId: string) {
    const content = newBullet[experienceId];
    if (!content?.trim()) return;
    await fetch(`/api/admin/experience/${experienceId}/bullets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setNewBullet((prev) => ({ ...prev, [experienceId]: "" }));
    load();
  }

  async function handleDeleteBullet(id: string) {
    await fetch(`/api/admin/experience-bullets/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main>
      <h1>Experience</h1>
      <button className="section" onClick={startNew}>
        + new entry
      </button>

      {editingId && (
        <form onSubmit={handleSave} className="section">
          <label>
            Company / Organization
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required />
          </label>
          <label>
            Organization URL (their site or LinkedIn page)
            <input value={form.company_url} onChange={(e) => setForm({ ...form, company_url: e.target.value })} />
          </label>
          <label>
            Location
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </label>
          <label>
            Role title
            <input value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} required />
          </label>
          <label>
            Employment type (e.g. "Part-time")
            <input value={form.employment_type} onChange={(e) => setForm({ ...form, employment_type: e.target.value })} />
          </label>
          <label>
            Start date
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
          </label>
          <label>
            End date (leave blank if current)
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.include_in_resume}
              onChange={(e) => setForm({ ...form, include_in_resume: e.target.checked })}
              style={{ width: "auto", marginRight: 8 }}
            />
            Include in resume PDF
          </label>

          <div className="section">
            <div className="muted" style={{ fontSize: "0.8rem", marginBottom: 8 }}>
              Linked skills (used by the homepage skill tree):
            </div>
            {skillGroups.map((g) => (
              <div key={g.id} style={{ marginBottom: 10 }}>
                <div className="muted" style={{ fontSize: "0.75rem", marginBottom: 4 }}>{g.label}</div>
                {g.skills.map((s) => (
                  <label key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 4, marginRight: 12, marginTop: 4 }}>
                    <input
                      type="checkbox"
                      checked={form.skill_ids.includes(s.id)}
                      onChange={() => toggleSkill(s.id)}
                      style={{ width: "auto" }}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            ))}
          </div>

          <div className="section">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>{" "}
            <button type="button" onClick={() => setEditingId(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <h2>All entries</h2>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : (
        items.map((item) => (
          <div key={item.id} className="project-card" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong>{item.company}</strong>
                {!item.include_in_resume && <span className="tag" style={{ marginLeft: 8 }}>excluded from resume</span>}
                <div className="muted">{item.role_title}</div>
              </div>
              <div>
                <button onClick={() => startEdit(item)}>edit</button>{" "}
                <button onClick={() => handleDelete(item.id)}>delete</button>
              </div>
            </div>

            <div className="section" style={{ marginTop: 12 }}>
              {item.experience_bullets?.length === 0 && (
                <p className="muted" style={{ fontSize: "0.8rem" }}>No bullets yet.</p>
              )}
              {item.experience_bullets?.map((b) => (
                <div key={b.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--line-soft)" }}>
                  <span style={{ fontSize: "0.85rem" }}>{b.content}</span>
                  <button onClick={() => handleDeleteBullet(b.id)}>remove</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  placeholder="new bullet"
                  value={newBullet[item.id] ?? ""}
                  onChange={(e) => setNewBullet((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  style={{ flex: 1 }}
                />
                <button onClick={() => handleAddBullet(item.id)}>+ add</button>
              </div>
            </div>
          </div>
        ))
      )}
    </main>
  );
}