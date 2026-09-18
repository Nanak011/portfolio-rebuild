"use client";

import { useEffect, useState } from "react";

type Entry = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  entry_date: string | null;
};
type Section = {
  id: string;
  label: string;
  slug: string;
  homepage_entries: Entry[];
};

export default function AdminSectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  const [newLabel, setNewLabel] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [addingSection, setAddingSection] = useState(false);

  const [entryForms, setEntryForms] = useState<Record<string, { title: string; description: string; url: string; entry_date: string }>>({});
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionLabel, setEditingSectionLabel] = useState("");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState({ title: "", description: "", url: "", entry_date: "" });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/sections");
    const json = await res.json();
    setSections(json.sections ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAddSection(e: React.FormEvent) {
    e.preventDefault();
    setAddingSection(true);
    await fetch("/api/admin/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel, slug: newSlug }),
    });
    setAddingSection(false);
    setNewLabel("");
    setNewSlug("");
    load();
  }

  async function handleDeleteSection(id: string) {
    if (!confirm("Delete this entire section and all its entries?")) return;
    await fetch(`/api/admin/sections/${id}`, { method: "DELETE" });
    load();
  }

  function startEditSection(s: Section) {
    setEditingSectionId(s.id);
    setEditingSectionLabel(s.label);
  }

  async function saveEditSection(s: Section) {
    await fetch(`/api/admin/sections/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editingSectionLabel, slug: s.slug }),
    });
    setEditingSectionId(null);
    load();
  }

  function updateEntryForm(sectionId: string, field: string, value: string) {
    setEntryForms((prev) => {
      const current = prev[sectionId] ?? { title: "", description: "", url: "", entry_date: "" };
      return { ...prev, [sectionId]: { ...current, [field]: value } };
    });
  }

  async function handleAddEntry(sectionId: string) {
    const form = entryForms[sectionId];
    if (!form?.title) return;
    await fetch(`/api/admin/sections/${sectionId}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setEntryForms((prev) => ({ ...prev, [sectionId]: { title: "", description: "", url: "", entry_date: "" } }));
    load();
  }

  async function handleDeleteEntry(id: string) {
    await fetch(`/api/admin/entries/${id}`, { method: "DELETE" });
    load();
  }

  function startEditEntry(e: Entry) {
    setEditingEntryId(e.id);
    setEditingEntry({
      title: e.title,
      description: e.description ?? "",
      url: e.url ?? "",
      entry_date: e.entry_date ?? "",
    });
  }

  async function saveEditEntry(id: string) {
    await fetch(`/api/admin/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingEntry),
    });
    setEditingEntryId(null);
    load();
  }

  return (
    <main>
      <h1>Additional Sections</h1>
      <p className="muted">
        Generic sections for anything beyond experience/education/projects — CTFs, publications,
        research, talks, etc. A section only shows on the public homepage once it has at least
        one entry.
      </p>

      <form onSubmit={handleAddSection} className="section">
        <label>
          New section label (e.g. "CTFs &amp; Competitions")
          <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} required />
        </label>
        <label>
          Slug (e.g. "ctfs" — lowercase, no spaces)
          <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} required />
        </label>
        <button type="submit" disabled={addingSection} style={{ marginTop: 12 }}>
          {addingSection ? "Adding..." : "+ Add section"}
        </button>
      </form>

      <h2>Sections</h2>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : sections.length === 0 ? (
        <p className="muted">No sections yet — add one above.</p>
      ) : (
        sections.map((s) => (
          <div key={s.id} className="project-card" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {editingSectionId === s.id ? (
                <div style={{ display: "flex", gap: 8, flex: 1 }}>
                  <input
                    value={editingSectionLabel}
                    onChange={(e) => setEditingSectionLabel(e.target.value)}
                  />
                  <button onClick={() => saveEditSection(s)}>save</button>
                  <button onClick={() => setEditingSectionId(null)}>cancel</button>
                </div>
              ) : (
                <>
                  <strong>{s.label}</strong>
                  <div>
                    <button onClick={() => startEditSection(s)}>rename</button>{" "}
                    <button onClick={() => handleDeleteSection(s.id)}>delete section</button>
                  </div>
                </>
              )}
            </div>

            <div className="section" style={{ marginTop: 12 }}>
              {(!s.homepage_entries || s.homepage_entries.length === 0) ? (
                <p className="muted" style={{ fontSize: "0.85rem" }}>
                  No entries yet — this section won't show on the homepage until you add one below.
                </p>
              ) : (
                s.homepage_entries.map((e) =>
                  editingEntryId === e.id ? (
                    <div key={e.id} className="section" style={{ padding: "10px 0", borderBottom: "1px solid var(--line-soft)" }}>
                      <label>
                        Title
                        <input
                          value={editingEntry.title}
                          onChange={(ev) => setEditingEntry({ ...editingEntry, title: ev.target.value })}
                        />
                      </label>
                      <label>
                        Description
                        <input
                          value={editingEntry.description}
                          onChange={(ev) => setEditingEntry({ ...editingEntry, description: ev.target.value })}
                        />
                      </label>
                      <label>
                        URL
                        <input
                          value={editingEntry.url}
                          onChange={(ev) => setEditingEntry({ ...editingEntry, url: ev.target.value })}
                        />
                      </label>
                      <label>
                        Date
                        <input
                          type="date"
                          value={editingEntry.entry_date}
                          onChange={(ev) => setEditingEntry({ ...editingEntry, entry_date: ev.target.value })}
                        />
                      </label>
                      <div style={{ marginTop: 8 }}>
                        <button onClick={() => saveEditEntry(e.id)}>save</button>{" "}
                        <button onClick={() => setEditingEntryId(null)}>cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--line-soft)" }}>
                      <span>
                        {e.title} {e.entry_date && <span className="muted">— {e.entry_date}</span>}
                      </span>
                      <span>
                        <button onClick={() => startEditEntry(e)}>edit</button>{" "}
                        <button onClick={() => handleDeleteEntry(e.id)}>remove</button>
                      </span>
                    </div>
                  )
                )
              )}
            </div>

            <div className="section" style={{ marginTop: 16 }}>
              <label>
                Entry title
                <input
                  value={entryForms[s.id]?.title ?? ""}
                  onChange={(e) => updateEntryForm(s.id, "title", e.target.value)}
                />
              </label>
              <label>
                Description (optional)
                <input
                  value={entryForms[s.id]?.description ?? ""}
                  onChange={(e) => updateEntryForm(s.id, "description", e.target.value)}
                />
              </label>
              <label>
                URL (optional)
                <input
                  value={entryForms[s.id]?.url ?? ""}
                  onChange={(e) => updateEntryForm(s.id, "url", e.target.value)}
                />
              </label>
              <label>
                Date (optional)
                <input
                  type="date"
                  value={entryForms[s.id]?.entry_date ?? ""}
                  onChange={(e) => updateEntryForm(s.id, "entry_date", e.target.value)}
                />
              </label>
              <button onClick={() => handleAddEntry(s.id)} style={{ marginTop: 12 }}>
                + Add entry
              </button>
            </div>
          </div>
        ))
      )}
    </main>
  );
}
