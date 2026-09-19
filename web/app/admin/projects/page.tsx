"use client";

import { useEffect, useState } from "react";

type ProjectLink = { id: string; label: string; url: string };
type Project = {
  id: string;
  title: string;
  slug: string;
  is_flagship: boolean;
  icon: string;
  problem: string;
  what_i_did: string;
  what_came_of_it: string;
  repo_url: string | null;
  demo_url: string | null;
  include_in_resume: boolean;
  custom_icon_url: string | null;
  sort_order: number;
  project_tags?: { tag: string }[];
  project_skills?: { skill_id: string }[];
  project_links?: ProjectLink[];
};
type Skill = { id: string; name: string };
type SkillGroup = { id: string; label: string; skills: Skill[] };

const ICON_OPTIONS = ["shield", "network", "terminal", "lock"];

const emptyForm = {
  title: "",
  slug: "",
  is_flagship: false,
  icon: "shield",
  problem: "",
  what_i_did: "",
  what_came_of_it: "",
  repo_url: "",
  demo_url: "",
  sort_order: 0,
  tags: "",
  skill_ids: [] as string[],
  include_in_resume: true,
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [skillGroups, setSkillGroups] = useState<SkillGroup[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newLink, setNewLink] = useState({ label: "", url: "" });
  const [linkingProjectId, setLinkingProjectId] = useState<string | null>(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  async function handleIconUpload(projectId: string, file: File | null) {
    if (!file) return;
    setUploadingIcon(true);
    const formData = new FormData();
    formData.append("file", file);
    await fetch(`/api/admin/projects/${projectId}/icon`, {
      method: "POST",
      body: formData,
    });
    setUploadingIcon(false);
    load();
  }

  async function handleRemoveIcon(projectId: string) {
    await fetch(`/api/admin/projects/${projectId}/icon`, { method: "DELETE" });
    load();
  }

  async function load() {
    setLoading(true);
    const [projRes, skillRes] = await Promise.all([
      fetch("/api/admin/projects"),
      fetch("/api/admin/skill-groups"),
    ]);
    const projJson = await projRes.json();
    const skillJson = await skillRes.json();
    setProjects(projJson.projects ?? []);
    setSkillGroups(skillJson.groups ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(p: Project) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      slug: p.slug,
      is_flagship: p.is_flagship,
      icon: p.icon || "shield",
      problem: p.problem,
      what_i_did: p.what_i_did,
      what_came_of_it: p.what_came_of_it,
      repo_url: p.repo_url ?? "",
      demo_url: p.demo_url ?? "",
      sort_order: p.sort_order,
      tags: (p.project_tags ?? []).map((t) => t.tag).join(", "),
      skill_ids: (p.project_skills ?? []).map((s) => s.skill_id),
      include_in_resume: p.include_in_resume,
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
      await fetch("/api/admin/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else if (editingId) {
      await fetch(`/api/admin/projects/${editingId}`, {
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
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    load();
  }

  async function handleAddLink(projectId: string) {
    if (!newLink.label.trim() || !newLink.url.trim()) return;
    await fetch(`/api/admin/projects/${projectId}/links`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLink),
    });
    setNewLink({ label: "", url: "" });
    load();
  }

  async function handleDeleteLink(id: string) {
    await fetch(`/api/admin/links/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main>
      <h1>Projects</h1>
      <button className="section" onClick={startNew}>
        + new project
      </button>

      {editingId && (
        <form onSubmit={handleSave} className="section">
          <label>
            Title
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </label>
          <label>
            Slug (url path — e.g. "aws-soar-engine" becomes /projects/aws-soar-engine)
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
            />
          </label>
          <label>
            Icon (preset — used unless a custom icon is uploaded below)
            <select
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
            >
              {ICON_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>

          {editingId !== "new" && (
            <div className="section">
              <div className="muted" style={{ fontSize: "0.8rem", marginBottom: 8 }}>
                Custom icon image (overrides the preset above):
              </div>
              {projects.find((p) => p.id === editingId)?.custom_icon_url && (
                <img
                  src={projects.find((p) => p.id === editingId)?.custom_icon_url ?? ""}
                  alt=""
                  style={{ width: 40, height: 40, marginBottom: 8 }}
                />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleIconUpload(editingId, e.target.files?.[0] ?? null)}
              />
              {uploadingIcon && <span className="muted"> uploading...</span>}
              <div style={{ marginTop: 8 }}>
                <button type="button" onClick={() => handleRemoveIcon(editingId)}>
                  remove custom icon
                </button>
              </div>
            </div>
          )}
          <label>
            Tags (comma-separated — e.g. "AWS, Lambda, WAF")
            <input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.is_flagship}
              onChange={(e) => setForm({ ...form, is_flagship: e.target.checked })}
              style={{ width: "auto", marginRight: 8 }}
            />
            Flagship project
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
          <label>
            Problem
            <textarea
              rows={3}
              value={form.problem}
              onChange={(e) => setForm({ ...form, problem: e.target.value })}
              required
            />
          </label>
          <label>
            What I did (one bullet per line — "Label: detail" bolds the label in the resume PDF)
            <textarea
              rows={6}
              value={form.what_i_did}
              onChange={(e) => setForm({ ...form, what_i_did: e.target.value })}
              required
            />
          </label>
          <label>
            What came of it
            <textarea
              rows={4}
              value={form.what_came_of_it}
              onChange={(e) => setForm({ ...form, what_came_of_it: e.target.value })}
              required
            />
          </label>
          <label>
            Repo URL
            <input
              value={form.repo_url}
              onChange={(e) => setForm({ ...form, repo_url: e.target.value })}
            />
          </label>
          <label>
            Demo URL
            <input
              value={form.demo_url}
              onChange={(e) => setForm({ ...form, demo_url: e.target.value })}
            />
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

      <h2>All projects</h2>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : (
        projects.map((p) => (
          <div key={p.id} className="project-card">
            <strong>{p.title}</strong> <span className="muted">/{p.slug} — icon: {p.icon}</span>
            {!p.include_in_resume && <span className="tag" style={{ marginLeft: 8 }}>excluded from resume</span>}
            <div className="muted" style={{ marginTop: 6 }}>
              {(p.project_tags ?? []).map((t) => t.tag).join(", ") || "no tags"}
            </div>

            <div className="section" style={{ marginTop: 12 }}>
              <div className="muted" style={{ fontSize: "0.75rem", marginBottom: 6 }}>
                Additional links (e.g. "Dataset" → Zenodo, "Live Site" → your URL):
              </div>
              {(p.project_links ?? []).map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "0.85rem" }}>
                  <a href={l.url} target="_blank">{l.label} — {l.url}</a>
                  <button onClick={() => handleDeleteLink(l.id)}>remove</button>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  placeholder="label (e.g. Dataset)"
                  value={linkingProjectId === p.id ? newLink.label : ""}
                  onFocus={() => setLinkingProjectId(p.id)}
                  onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                  style={{ flex: 1 }}
                />
                <input
                  placeholder="https://..."
                  value={linkingProjectId === p.id ? newLink.url : ""}
                  onFocus={() => setLinkingProjectId(p.id)}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  style={{ flex: 1 }}
                />
                <button onClick={() => handleAddLink(p.id)}>+ add link</button>
              </div>
            </div>

            <div className="section">
              <button onClick={() => startEdit(p)}>edit</button>{" "}
              <button onClick={() => handleDelete(p.id)}>delete</button>
            </div>
          </div>
        ))
      )}
    </main>
  );
}