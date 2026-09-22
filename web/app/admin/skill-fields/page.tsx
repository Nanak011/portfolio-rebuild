"use client";

import { useEffect, useState } from "react";

type Skill = { id: string; name: string };
type SkillGroup = { id: string; label: string; skills: Skill[] };
type Field = {
  id: string;
  label: string;
  percentage: number;
  skill_field_skills?: { skill_id: string }[];
};

const emptyForm = { label: "", percentage: 50, skill_ids: [] as string[] };

export default function AdminSkillFieldsPage() {
  const [fields, setFields] = useState<Field[]>([]);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [fieldRes, skillRes] = await Promise.all([
      fetch("/api/admin/skill-fields"),
      fetch("/api/admin/skill-groups"),
    ]);
    const fieldJson = await fieldRes.json();
    const skillJson = await skillRes.json();
    setFields(fieldJson.fields ?? []);
    setSkillGroups(skillJson.groups ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(f: Field) {
    setEditingId(f.id);
    setForm({
      label: f.label,
      percentage: f.percentage,
      skill_ids: (f.skill_field_skills ?? []).map((s) => s.skill_id),
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
      await fetch("/api/admin/skill-fields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else if (editingId) {
      await fetch(`/api/admin/skill-fields/${editingId}`, {
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
    if (!confirm("Delete this field?")) return;
    await fetch(`/api/admin/skill-fields/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main>
      <h1>Skill Fields (Domain Matrix)</h1>
      <p className="muted">
        Broad domain areas for the homepage overview matrix — Blue Team/Defense, Red Team/Offense,
        Cloud, AI/Automation/GRC, or whatever fields describe you. Separate from Skills/Groups
        above; this is about where you sit across career domains, not tools. Percentage sets how
        far that field's wedge reaches on the chart; the skills you attach show up when someone
        hovers that wedge.
      </p>

      <button className="section" onClick={startNew}>
        + new field
      </button>

      {editingId && (
        <form onSubmit={handleSave} className="section">
          <label>
            Field label (e.g. "Blue Team / Defense")
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
          </label>
          <label>
            Percentage: {form.percentage}%
            <input
              type="range"
              min={0}
              max={100}
              value={form.percentage}
              onChange={(e) => setForm({ ...form, percentage: Number(e.target.value) })}
              style={{ width: "100%", marginTop: 6 }}
            />
          </label>

          <div className="section">
            <div className="muted" style={{ fontSize: "0.8rem", marginBottom: 8 }}>
              Skills shown when this field is hovered:
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

      <h2>All fields</h2>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : fields.length === 0 ? (
        <p className="muted">No fields yet — add one above. You'll want at least 3 for the chart to render.</p>
      ) : (
        fields.map((f) => (
          <div key={f.id} className="project-card">
            <strong>{f.label}</strong> <span className="muted">— {f.percentage}%</span>
            <div className="section">
              <button onClick={() => startEdit(f)}>edit</button>{" "}
              <button onClick={() => handleDelete(f.id)}>delete</button>
            </div>
          </div>
        ))
      )}
    </main>
  );
}