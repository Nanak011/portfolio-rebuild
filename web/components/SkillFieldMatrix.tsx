"use client";

import { useState } from "react";

type Field = {
  id: string;
  label: string;
  percentage: number;
  skills: string[];
};

const SIZE = 280; // pixel size of the square area; SVG viewBox matches 1:1
                   // so label math can convert straight to CSS percentages.

export default function SkillFieldMatrix({ fields }: { fields: Field[] }) {
  const [hovered, setHovered] = useState<Field | null>(null);

  const n = fields.length;
  const cx = 140;
  const cy = 140;
  const R = 95;

  if (n < 3) return null;

  const toXY = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const wedgeAngle = 360 / n;
  const boundaryAngles = Array.from({ length: n }, (_, i) => i * wedgeAngle - 90);

  const wedges = fields.map((f, i) => {
    const startAngle = i * wedgeAngle - 90;
    const endAngle = startAngle + wedgeAngle;
    const midAngle = (startAngle + endAngle) / 2;
    const r = (f.percentage / 100) * R;
    const p1 = toXY(startAngle, r);
    const p2 = toXY(endAngle, r);
    const largeArc = wedgeAngle > 180 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;

    // Label position, expressed as a plain HTML element placed absolutely
    // over the SVG rather than SVG <text> — regular HTML never clips the
    // way a fixed SVG viewBox does, no matter how long the label is.
    const labelPoint = toXY(midAngle, R + 20);
    const leftPct = (labelPoint.x / SIZE) * 100;
    const topPct = (labelPoint.y / SIZE) * 100;
    const cosVal = Math.cos((midAngle * Math.PI) / 180);
    let translateX = "-50%";
    if (cosVal > 0.35) translateX = "0%";
    else if (cosVal < -0.35) translateX = "-100%";

    return { field: f, path, leftPct, topPct, translateX };
  });

  const rings = [
    { f: 0.25, faint: true },
    { f: 0.5, faint: true },
    { f: 0.75, faint: true },
    { f: 1, faint: false }, // outer boundary — the "main circumference", stays solid
  ];
  const spokeEnd = R + 15;
  const bracketOffset = R + 25;

  return (
    <div style={{ position: "relative", width: SIZE, height: SIZE }}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} style={{ display: "block" }}>
        {rings.map((ring, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={R * ring.f}
            stroke={ring.faint ? "#c7c7bb" : "#201f1a"}
            strokeWidth={ring.faint ? 1 : 1.5}
            fill="none"
          />
        ))}

        {boundaryAngles.map((angle, i) => {
          const p = toXY(angle, spokeEnd);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#201f1a" strokeWidth="1" />;
        })}

        {wedges.map((w) => (
          <path
            key={w.field.id}
            d={w.path}
            fill="#201f1a"
            fillOpacity={0.15 + (w.field.percentage / 100) * 0.55}
            stroke="none"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHovered(w.field)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        <circle cx={cx} cy={cy} r="3" fill="#201f1a" />

        <path d={`M ${cx - bracketOffset} ${cy - bracketOffset + 18} L ${cx - bracketOffset} ${cy - bracketOffset} L ${cx - bracketOffset + 18} ${cy - bracketOffset}`} stroke="#201f1a" strokeWidth="1" fill="none" />
        <path d={`M ${cx + bracketOffset} ${cy - bracketOffset + 18} L ${cx + bracketOffset} ${cy - bracketOffset} L ${cx + bracketOffset - 18} ${cy - bracketOffset}`} stroke="#201f1a" strokeWidth="1" fill="none" />
        <path d={`M ${cx - bracketOffset} ${cy + bracketOffset - 18} L ${cx - bracketOffset} ${cy + bracketOffset} L ${cx - bracketOffset + 18} ${cy + bracketOffset}`} stroke="#201f1a" strokeWidth="1" fill="none" />
        <path d={`M ${cx + bracketOffset} ${cy + bracketOffset - 18} L ${cx + bracketOffset} ${cy + bracketOffset} L ${cx + bracketOffset - 18} ${cy + bracketOffset}`} stroke="#201f1a" strokeWidth="1" fill="none" />
      </svg>

      {wedges.map((w) => (
        <span
          key={w.field.id}
          onMouseEnter={() => setHovered(w.field)}
          onMouseLeave={() => setHovered(null)}
          style={{
            position: "absolute",
            left: `${w.leftPct}%`,
            top: `${w.topPct}%`,
            transform: `translate(${w.translateX}, -50%)`,
            fontFamily: "var(--font-display), monospace",
            fontSize: "0.9rem",
            whiteSpace: "nowrap",
            cursor: "pointer",
            color: hovered?.id === w.field.id ? "var(--ink)" : "var(--muted)",
          }}
        >
          {w.field.label.toUpperCase()}
        </span>
      ))}

      {hovered && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: 14,
            width: 220,
            background: "var(--bg)",
            border: "1px solid var(--ink)",
            padding: "10px 12px",
            fontSize: "0.72rem",
            zIndex: 10,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            {hovered.label.toUpperCase()} — {hovered.percentage}%
          </div>
          <div className="muted">{hovered.skills.join(" · ") || "No skills attached yet"}</div>
        </div>
      )}
    </div>
  );
}