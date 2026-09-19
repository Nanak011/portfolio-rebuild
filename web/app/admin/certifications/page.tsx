"use client";

import { useEffect, useState } from "react";

type Cert = { id: string; name: string; issuer: string | null; credential_url: string | null };
type Group = { id: string; label: string; certifications: Cert[] };

export default function AdminCertificationsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [addingGroup, setAddingGroup] = useState(false);
  const [newCert, setNewCert] = useState<Record<string, { name: string; issuer: string; credential_url: string }>>({});
  const [editingCertId, setEditingCertId] = useState<string | null>(null);
  const [editingCert, setEditingCert] = useState({ name: "", issuer: "", credential_url: "" });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/certification-groups");
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
    await fetch("/api/admin/certification-groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newGroupLabel }),
    });
    setAddingGroup(false);
    setNewGroupLabel("");
    load();
  }

  async function handleDeleteGroup(id: string) {
    if (!confirm("Delete this group and all certifications in it?")) return;
    await fetch(`/api/admin/certification-groups/${id}`, { method: "DELETE" });
    load();
  }

  function updateNewCert(groupId: string, field: "name" | "issuer" | "credential_url", value: string) {
    setNewCert((prev) => {
      const current = prev[groupId] ?? { name: "", issuer: "", credential_url: "" };
      return { ...prev, [groupId]: { ...current, [field]: value } };
    });
  }

  async function handleAddCert(groupId: string) {
    const entry = newCert[groupId];
    if (!entry?.name?.trim()) return;
    await fetch(`/api/admin/certification-groups/${groupId}/certifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    setNewCert((prev) => ({ ...prev, [groupId]: { name: "", issuer: "", credential_url: "" } }));
    load();
  }

  async function handleDeleteCert(id: string) {
    await fetch(`/api/admin/certifications/${id}`, { method: "DELETE" });
    load();
  }

  function startEditCert(c: Cert) {
    setEditingCertId(c.id);
    setEditingCert({ name: c.name, issuer: c.issuer ?? "", credential_url: c.credential_url ?? "" });
  }

  async function saveEditCert(id: string) {
    await fetch(`/api/admin/certifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingCert),
    });
    setEditingCertId(null);
    load();
  }

  return (
    <main>
      <h1>Certifications</h1>
      <p className="muted">
        Groups (e.g. "Professional Certifications", "Coursework &amp; Technical Training") and the
        certifications within each. The credential link can point to a verification page or a
        direct PDF (e.g. a Google Drive link to your certificate file) — shown on the homepage and
        in the resume PDF as a clickable link.
      </p>

      <form onSubmit={handleAddGroup} className="section">
        <label>
          New group label
          <input value={newGroupLabel} onChange={(e) => setNewGroupLabel(e.target.value)} />
        </label>
        <button type="submit" disabled={addingGroup} style={{ marginTop: 12 }}>
          {addingGroup ? "Adding..." : "+ Add group"}
        </button>
      </form>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : groups.length === 0 ? (
        <p className="muted">No certification groups yet — add one above.</p>
      ) : (
        groups.map((g) => (
          <div key={g.id} className="project-card" style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{g.label}</strong>
              <button onClick={() => handleDeleteGroup(g.id)}>delete group</button>
            </div>

            <div className="section" style={{ marginTop: 10 }}>
              {g.certifications?.length === 0 && (
                <p className="muted" style={{ fontSize: "0.8rem" }}>No certifications yet.</p>
              )}
              {g.certifications?.map((c) =>
                editingCertId === c.id ? (
                  <div key={c.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line-soft)" }}>
                    <label>
                      Name
                      <input value={editingCert.name} onChange={(e) => setEditingCert({ ...editingCert, name: e.target.value })} />
                    </label>
                    <label>
                      Issuer
                      <input value={editingCert.issuer} onChange={(e) => setEditingCert({ ...editingCert, issuer: e.target.value })} />
                    </label>
                    <label>
                      Credential URL (verification page or direct PDF link)
                      <input value={editingCert.credential_url} onChange={(e) => setEditingCert({ ...editingCert, credential_url: e.target.value })} />
                    </label>
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => saveEditCert(c.id)}>save</button>{" "}
                      <button onClick={() => setEditingCertId(null)}>cancel</button>
                    </div>
                  </div>
                ) : (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--line-soft)" }}>
                    <span style={{ fontSize: "0.85rem" }}>
                      {c.issuer && <strong>{c.issuer}: </strong>}
                      {c.name}
                      {c.credential_url && (
                        <a href={c.credential_url} target="_blank" style={{ marginLeft: 8 }}>
                          view →
                        </a>
                      )}
                    </span>
                    <span>
                      <button onClick={() => startEditCert(c)}>edit</button>{" "}
                      <button onClick={() => handleDeleteCert(c.id)}>remove</button>
                    </span>
                  </div>
                )
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <input
                placeholder="certification name"
                value={newCert[g.id]?.name ?? ""}
                onChange={(e) => updateNewCert(g.id, "name", e.target.value)}
              />
              <input
                placeholder="issuer (optional)"
                value={newCert[g.id]?.issuer ?? ""}
                onChange={(e) => updateNewCert(g.id, "issuer", e.target.value)}
              />
              <input
                placeholder="credential URL (optional)"
                value={newCert[g.id]?.credential_url ?? ""}
                onChange={(e) => updateNewCert(g.id, "credential_url", e.target.value)}
              />
              <button onClick={() => handleAddCert(g.id)}>+ add</button>
            </div>
          </div>
        ))
      )}
    </main>
  );
}
