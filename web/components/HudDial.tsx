export default function HudDial({
  label,
  value,
  maxValue,
  unit,
}: {
  label: string;
  value: number;
  maxValue: number;
  unit?: string | null;
}) {
  const pct = Math.max(0, Math.min(1, value / (maxValue || 1)));
  const angle = 180 - pct * 180; // 180deg (left) = 0%, 0deg (right) = 100%
  const rad = (angle * Math.PI) / 180;
  const cx = 80;
  const cy = 88;
  const r = 62;
  const needleX = cx + r * 0.82 * Math.cos(rad);
  const needleY = cy - r * 0.82 * Math.sin(rad);

  const ticks = Array.from({ length: 7 }, (_, i) => {
    const tAngle = 180 - (i / 6) * 180;
    const tRad = (tAngle * Math.PI) / 180;
    const x1 = cx + (r - 2) * Math.cos(tRad);
    const y1 = cy - (r - 2) * Math.sin(tRad);
    const x2 = cx + (r + 6) * Math.cos(tRad);
    const y2 = cy - (r + 6) * Math.sin(tRad);
    return { x1, y1, x2, y2 };
  });

  return (
    <div style={{ textAlign: "center", width: 160 }}>
      <svg viewBox="0 0 160 100" width="160" height="100">
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          stroke="#b9b9ab"
          strokeWidth="1"
          fill="none"
        />
        {ticks.map((t, i) => (
          <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#201f1a" strokeWidth="1" />
        ))}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#201f1a" strokeWidth="1.5" />
        <circle cx={cx} cy={cy} r="3" fill="#201f1a" />
      </svg>
      <div style={{ font: "12px var(--font-display), monospace", marginTop: -6 }}>
        {value}
        {unit ?? ""} / {maxValue}
        {unit ?? ""}
      </div>
      <div style={{ fontSize: "0.68rem", color: "var(--muted)", marginTop: 2 }}>
        {label.toUpperCase()}
      </div>
    </div>
  );
}
