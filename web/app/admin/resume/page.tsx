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
  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const [extraLabels, setExtraLabels] = useState<Record<string, string>>({});

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
      const extraLabels = Object.fromEntries(withEntries.map((s: any) => [`extra_${s.slug}`, s.label]));
      setExtraLabels(extraLabels);
      setOrder((prev) => [...prev, ...extraKeys.filter((k: string) => !prev.includes(k))]);
      setSections((prev) => ({
        ...Object.fromEntries(extraKeys.map((k: string) => [k, true])),
        ...prev,
      }));
    }
    setSectionsLoaded(true);
  }

  useEffect(() => {
    load();
    loadExtraSections();
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

  async function handleGenerate() {
    setGenerating(true);
    setMessage(null);
    const res = await fetch("/api/admin/generate-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label || undefined, sections, order }),
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
              <button
                type="button"
                onClick={() => moveSection(i, -1)}
                disabled={i === 0}
                style={{ padding: "2px 8px" }}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveSection(i, 1)}
                disabled={i === order.length - 1}
                style={{ padding: "2px 8px" }}
              >
                ↓
              </button>
            </div>
          ))}
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
