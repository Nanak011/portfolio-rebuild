"use client";

import { useEffect, useState } from "react";

type Education = {
  id: string;
  institution: string;
  location: string | null;
  degree: string;
  start_date: string | null;
  end_date: string | null;
  is_expected: boolean;
  sort_order: number;
};

const emptyForm = {
  institution: "",
  location: "",
  degree: "",
  start_date: "",
  end_date: "",
  is_expected: false,
  sort_order: 0,
};

export default function AdminEducationPage() {
  const [items, setItems] = useState<Education[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/education");
    const json = await res.json();
    setItems(json.education ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(item: Education) {
    setEditingId(item.id);
    setForm({
      institution: item.institution,
      location: item.location ?? "",
      degree: item.degree,
      start_date: item.start_date ?? "",
      end_date: item.end_date ?? "",
      is_expected: item.is_expected,
      sort_order: item.sort_order,
    });
  }

  function startNew() {
    setEditingId("new");
    setForm(emptyForm);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    if (editingId === "new") {
      await fetch("/api/admin/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else if (editingId) {
      await fetch(`/api/admin/education/${editingId}`, {
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
    if (!confirm("Delete this education entry?")) return;
    await fetch(`/api/admin/education/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main>
      <h1>Education</h1>
      <button className="section" onClick={startNew}>
        + new entry
      </button>

      {editingId && (
        <form onSubmit={handleSave} className="section">
          <label>
            Institution
            <input
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
              required
            />
          </label>
          <label>
            Location
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </label>
          <label>
            Degree / program
            <input
              value={form.degree}
              onChange={(e) => setForm({ ...form, degree: e.target.value })}
              required
            />
          </label>
          <label>
            Start date
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </label>
          <label>
            End date (leave blank if ongoing)
            <input
              type="date"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={form.is_expected}
              onChange={(e) => setForm({ ...form, is_expected: e.target.checked })}
              style={{ width: "auto", marginRight: 8 }}
            />
            End date is expected (not yet completed)
          </label>

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
          <div key={item.id} className="project-card">
            <strong>{item.institution}</strong>
            <div className="muted">{item.degree}</div>
            <div className="section">
              <button onClick={() => startEdit(item)}>edit</button>{" "}
              <button onClick={() => handleDelete(item.id)}>delete</button>
            </div>
          </div>
        ))
      )}
    </main>
  );
}
