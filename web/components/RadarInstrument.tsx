// "use client";

// // TUNABLE VALUES — adjust the constants below, not the JSX.
// //
// // OPEN_LEG_Y_OFFSET   Position of "OPEN" along its leg (0 = at the tip,
// //                     1 = at the arc). Lower = moves OPEN up.
// //
// // ARC_TEXT_OFFSET     Where "TO OPPORTUNI" sits along the curve, as a
// //                     percent string for startOffset. Increase = shifts
// //                     toward the TIES side. Decrease = shifts toward OPEN.
// //
// // TIES_TEXT_OFFSET    Where "TIES" sits along its leg, as a percent string.
// //                     This path runs from the arc down to the clock, so a
// //                     SMALLER value = closer to the arc ("up"), a LARGER
// //                     value = closer to the clock ("down").
// //
// // PIVOT_ANGLE_DEG     Where the TIES leg meets the clock rim (0 = 12
// //                     o'clock, negative = toward 11/10 o'clock).
// //
// // TIES_LEG_LEN / OPEN_LEG_LEN   Length of each straight leg, in px.
// //
// // ARC_R               Radius of the curve connecting OPEN and TIES.
// //                     Bigger = wider arch, more room for "TO OPPORTUNI".
// //
// // CX / CY / R         Clock center and radius.

// import { useEffect, useMemo, useState } from "react";

// const INK = "#201f1a";
// const MUTED = "#77776b";

// const CX = 165;
// const CY = 195;
// const R = 90;

// const PIVOT_ANGLE_DEG = -35;
// const TIES_LEG_LEN = 55;
// const OPEN_LEG_LEN = 47;
// const ARC_R = 47;

// const OPEN_LEG_Y_OFFSET = -0.5; // 0 = at tip, 1 = at arc
// const ARC_TEXT_OFFSET = "1.5%";
// const TIES_TEXT_OFFSET = "-1%";

// const FONT = {
//   font: "14px var(--font-display), monospace",
//   letterSpacing: "2px",
// };

// // angle convention: 0deg = straight up, positive = clockwise
// function dir(deg: number) {
//   const rad = (deg * Math.PI) / 180;
//   return { x: Math.sin(rad), y: -Math.cos(rad) };
// }

// export default function OpenToOpportunitiesIcon() {
//   const [now, setNow] = useState<Date | null>(null);

//   useEffect(() => {
//     setNow(new Date());
//     const id = setInterval(() => setNow(new Date()), 1000);
//     return () => clearInterval(id);
//   }, []);

//   // Compute live angles based on current local device time
//   const seconds = now ? now.getSeconds() : 0;
//   const minutes = now ? now.getMinutes() : 0;
//   const hours = now ? now.getHours() % 12 : 0;

//   const secAngle = seconds * 6;
//   const minAngle = minutes * 6 + seconds * 0.1;
//   const hourAngle = hours * 30 + minutes * 0.5;

//   const geometry = useMemo(() => {
//     // Pivot: where the TIES leg meets the clock rim
//     const pivotDir = dir(PIVOT_ANGLE_DEG);
//     const P3 = { x: CX + R * pivotDir.x, y: CY + R * pivotDir.y };

//     // TIES leg: straight up from the pivot
//     const P2 = { x: P3.x, y: P3.y - TIES_LEG_LEN };

//     // Arc: exact semicircle connecting P2 (right) to P1 (left), bulging up
//     const arcCenter = { x: P2.x - ARC_R, y: P2.y };
//     const P1 = { x: arcCenter.x - ARC_R, y: arcCenter.y };

//     // OPEN leg: straight up from P1
//     const P0 = { x: P1.x, y: P1.y - OPEN_LEG_LEN };

//     const openTextY = P1.y - OPEN_LEG_Y_OFFSET * OPEN_LEG_LEN;

//     return {
//       arcPath: `M ${P1.x} ${P1.y} A ${ARC_R} ${ARC_R} 0 0 1 ${P2.x} ${P2.y}`,
//       tiesLegPath: `M ${P2.x} ${P2.y} L ${P3.x} ${P3.y}`,
//       openTextX: 15,
//       openTextY,
//     };
//   }, []);

//   const ticks = Array.from({ length: 12 }, (_, i) => {
//     const rad = (i * 30 * Math.PI) / 180;
//     const inner = i % 3 === 0 ? R - 12 : R - 6;
//     return {
//       x1: CX + inner * Math.sin(rad),
//       y1: CY - inner * Math.cos(rad),
//       x2: CX + (R - 1) * Math.sin(rad),
//       y2: CY - (R - 1) * Math.cos(rad),
//       major: i % 3 === 0,
//     };
//   });

//   return (
//     <svg
//       viewBox="0 0 280 300"
//       width="300"
//       height="321"
//       role="img"
//       aria-label="Clock icon, open to opportunities"
//     >
//       <defs>
//         <path id="arcMid" d={geometry.arcPath} />
//         <path id="legFixed" d={geometry.tiesLegPath} />
//       </defs>

//       <text
//         x={geometry.openTextX}
//         y={geometry.openTextY}
//         textAnchor="middle"
//         dominantBaseline="middle"
//         transform={`rotate(-90 ${geometry.openTextX} ${geometry.openTextY})`}
//         fill={INK}
//         style={FONT}
//       >
//         OPEN
//       </text>

//       <g fill={INK} style={FONT}>
//         <text>
//           <textPath href="#arcMid" startOffset={ARC_TEXT_OFFSET}>
//             TO OPPORTUNI
//           </textPath>
//         </text>
//         <text>
//           <textPath href="#legFixed" startOffset={TIES_TEXT_OFFSET}>
//             TIES
//           </textPath>
//         </text>
//       </g>

//       <circle cx={CX} cy={CY} r={R} fill="none" stroke={INK} strokeWidth={1.5} />

//       {ticks.map((t, i) => (
//         <line
//           key={i}
//           x1={t.x1}
//           y1={t.y1}
//           x2={t.x2}
//           y2={t.y2}
//           stroke={INK}
//           strokeWidth={t.major ? 1.6 : 1}
//           strokeLinecap="round"
//         />
//       ))}

//       {/* Dynamic Hour Hand */}
//       <line
//         x1={CX}
//         y1={CY}
//         x2={CX}
//         y2={CY - 48}
//         stroke={INK}
//         strokeWidth={2.4}
//         strokeLinecap="round"
//         transform={`rotate(${hourAngle} ${CX} ${CY})`}
//       />

//       {/* Dynamic Minute Hand */}
//       <line
//         x1={CX}
//         y1={CY}
//         x2={CX}
//         y2={CY - 68}
//         stroke={INK}
//         strokeWidth={1.8}
//         strokeLinecap="round"
//         transform={`rotate(${minAngle} ${CX} ${CY})`}
//       />

//       {/* Dynamic Second Hand */}
//       <line
//         x1={CX}
//         y1={CY}
//         x2={CX}
//         y2={CY - 72}
//         stroke={MUTED}
//         strokeWidth={1}
//         strokeLinecap="round"
//         transform={`rotate(${secAngle} ${CX} ${CY})`}
//       />

//       <circle cx={CX} cy={CY} r={3} fill={INK} />
//     </svg>
//   );
// }


























