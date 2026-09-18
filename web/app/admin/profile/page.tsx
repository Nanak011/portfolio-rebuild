"use client";

import { useEffect, useState } from "react";

const empty = {
  full_name: "",
  location: "",
  phone: "",
  email: "",
  linkedin_url: "",
  github_url: "",
  summary: "",
  proof_statement: "",
};

export default function AdminProfilePage() {
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/profile")
      .then((r) => r.json())
      .then((json) => {
        if (json.profile) setForm(json.profile);
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/admin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setMessage(res.ok ? "Saved." : "Something went wrong.");
  }

  if (loading) return <main><p className="muted">Loading...</p></main>;

  return (
    <main>
      <h1>Profile</h1>
      <p className="muted">Editing the hero, summary, and contact info shown on the homepage.</p>

      <form onSubmit={handleSave} className="section">
        <label>
          Full name
          <input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
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
          Phone
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <label>
          Email
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label>
          LinkedIn URL
          <input
            value={form.linkedin_url}
            onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
          />
        </label>
        <label>
          GitHub URL
          <input
            value={form.github_url}
            onChange={(e) => setForm({ ...form, github_url: e.target.value })}
          />
        </label>
        <label>
          Professional summary
          <textarea
            rows={6}
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
            required
          />
        </label>
        <label>
          Proof statement (optional one-liner)
          <input
            value={form.proof_statement ?? ""}
            onChange={(e) => setForm({ ...form, proof_statement: e.target.value })}
          />
        </label>

        <div className="section">
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          {message && <span className="muted" style={{ marginLeft: 12 }}>{message}</span>}
        </div>
      </form>
    </main>
  );
}
