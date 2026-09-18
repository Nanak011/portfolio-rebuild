"use client";

import { useEffect, useState } from "react";

type Skill = { id: string; name: string };
type Group = { id: string; label: string; skills: Skill[] };

export default function AdminSkillsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);
  const [newSkillName, setNewSkillName] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/skill-groups");
    const json = await res.json();
    setGroups(json.groups ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupLabel.trim()) return;
    setAddingGroup(true);
    await fetch("/api/admin/skill-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newGroupLabel }),
    });
    setAddingGroup(false);
    setNewGroupLabel("");
    load();
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm("Delete this group and all skills in it?")) return;
    await fetch(`/api/admin/skill-groups/${id}`, { method: "DELETE" });
    load();
  }

  async function handleAddSkill(groupId: string) {
    const name = newSkillName[groupId];
    if (!name?.trim()) return;
    await fetch(`/api/admin/skill-groups/${groupId}/skills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setNewSkillName((prev) => ({ ...prev, [groupId]: "" }));
    load();
  }

  async function handleDeleteSkill(id: string) {
    await fetch(`/api/admin/skills/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main>
      <h1>Skills</h1>
      <p className="muted">
        These populate both the homepage skill tree and its links to matching projects/experience.
      </p>

      <form onSubmit={handleAddGroup} className="section">
        <label>
          New group label (e.g. "Tools")
          <input value={newGroupLabel} onChange={(e) => setNewGroupLabel(e.target.value)} />
        </label>
        <button type="submit" disabled={addingGroup} style={{ marginTop: 12 }}>
          {addingGroup ? "Adding..." : "+ Add group"}
        </button>
      </form>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : (
        groups.map((g) => (
          <div key={g.id} className="project-card" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{g.label}</strong>
              <button onClick={() => handleDeleteGroup(g.id)}>delete group</button>
            </div>

            <div className="section" style={{ marginTop: 10 }}>
              {g.skills?.map((s) => (
                <span key={s.id} className="tag" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginRight: 8, marginBottom: 8 }}>
                  {s.name}
                  <button
                    onClick={() => handleDeleteSkill(s.id)}
                    style={{ boxShadow: "none", border: "none", padding: 0, fontSize: "0.7rem" }}
                    title="remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input
                placeholder="new skill name"
                value={newSkillName[g.id] ?? ""}
                onChange={(e) => setNewSkillName((prev) => ({ ...prev, [g.id]: e.target.value }))}
              />
              <button onClick={() => handleAddSkill(g.id)}>+ add</button>
            </div>
          </div>
        ))
      )}
    </main>
  );
}
