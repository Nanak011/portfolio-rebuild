"use client";

import { useEffect, useState } from "react";

type Stat = {
  id: string;
  label: string;
  value: number;
  max_value: number;
  unit: string | null;
};

const emptyForm = { label: "", value: "", max_value: "100", unit: "" };

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/stats");
    const json = await res.json();
    setStats(json.stats ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(s: Stat) {
    setEditingId(s.id);
    setForm({ label: s.label, value: String(s.value), max_value: String(s.max_value), unit: s.unit ?? "" });
  }

  function startNew() {
    setEditingId("new");
    setForm(emptyForm);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (editingId === "new") {
      await fetch("/api/admin/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else if (editingId) {
      await fetch(`/api/admin/stats/${editingId}`, {
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
    if (!confirm("Delete this stat?")) return;
    await fetch(`/api/admin/stats/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <main>
      <h1>Telemetry / Stats</h1>
      <p className="muted">
        Custom dial gauges for the homepage (e.g. "CTFs solved", "Years in security", "Reports filed").
        Only shows on the homepage once you've added at least one.
      </p>

      <button className="section" onClick={startNew}>
        + new stat
      </button>

      {editingId && (
        <form onSubmit={handleSave} className="section">
          <label>
            Label
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
          </label>
          <label>
            Value
            <input
              type="number"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              required
            />
          </label>
          <label>
            Max value (for the dial's full scale)
            <input
              type="number"
              value={form.max_value}
              onChange={(e) => setForm({ ...form, max_value: e.target.value })}
            />
          </label>
          <label>
            Unit (optional, e.g. "%", "hrs")
            <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
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

      <h2>All stats</h2>
      {loading ? (
        <p className="muted">Loading...</p>
      ) : stats.length === 0 ? (
        <p className="muted">No stats yet — add one above.</p>
      ) : (
        stats.map((s) => (
          <div key={s.id} className="project-card">
            <strong>{s.label}</strong>
            <div className="muted">
              {s.value}
              {s.unit} / {s.max_value}
              {s.unit}
            </div>
            <div className="section">
              <button onClick={() => startEdit(s)}>edit</button>{" "}
              <button onClick={() => handleDelete(s.id)}>delete</button>
            </div>
          </div>
        ))
      )}
    </main>
  );
}
