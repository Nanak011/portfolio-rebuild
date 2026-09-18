export default function RadarInstrument({
  projects,
  certs,
  roles,
}: {
  projects: number;
  certs: number;
  roles: number;
}) {
  return (
    <svg viewBox="0 0 260 260" width="240" height="240">
      <circle cx="130" cy="130" r="100" stroke="#201f1a" strokeWidth="1" fill="none" />
      <circle cx="130" cy="130" r="70" stroke="#b9b9ab" strokeWidth="1" fill="none" />
      <circle cx="130" cy="130" r="40" stroke="#b9b9ab" strokeWidth="1" fill="none" />
      <line x1="130" y1="10" x2="130" y2="250" stroke="#b9b9ab" strokeWidth="1" />
      <line x1="10" y1="130" x2="250" y2="130" stroke="#b9b9ab" strokeWidth="1" />
      {/* corner ticks */}
      <path d="M40 60 L40 40 L60 40" stroke="#201f1a" strokeWidth="1" fill="none" />
      <path d="M220 60 L220 40 L200 40" stroke="#201f1a" strokeWidth="1" fill="none" />
      <path d="M40 200 L40 220 L60 220" stroke="#201f1a" strokeWidth="1" fill="none" />
      <path d="M220 200 L220 220 L200 220" stroke="#201f1a" strokeWidth="1" fill="none" />
      {/* center crosshair */}
      <line x1="122" y1="130" x2="138" y2="130" stroke="#201f1a" strokeWidth="1.5" />
      <line x1="130" y1="122" x2="130" y2="138" stroke="#201f1a" strokeWidth="1.5" />
      {/* readout box */}
      <rect x="150" y="78" width="86" height="56" stroke="#201f1a" strokeWidth="1" fill="#eeeeea" />
      <text x="158" y="96" style={{ font: "9px var(--font-display), monospace" }} fill="#201f1a">
        PRJ {String(projects).padStart(2, "0")}
      </text>
      <text x="158" y="112" style={{ font: "9px var(--font-display), monospace" }} fill="#201f1a">
        CRT {String(certs).padStart(2, "0")}
      </text>
      <text x="158" y="128" style={{ font: "9px var(--font-display), monospace" }} fill="#201f1a">
        EXP {String(roles).padStart(2, "0")}
      </text>
    </svg>
  );
}
