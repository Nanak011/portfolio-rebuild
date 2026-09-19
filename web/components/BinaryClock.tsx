"use client";

import { useEffect, useState } from "react";

function toBCD(n: number): [number, number] {
  return [Math.floor(n / 10), n % 10];
}

function bits(n: number) {
  return [8, 4, 2, 1].map((b) => (n & b ? 1 : 0));
}

export default function BinaryClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) return null;

  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();
  const digits = [...toBCD(h), ...toBCD(m), ...toBCD(s)];

  return (
    <div className="binary-clock" aria-hidden="true">
      <div className="binary-clock-cols">
        {digits.map((d, i) => (
          <div key={i} className="binary-clock-col">
            {bits(d).map((bit, j) => (
              <span key={j} className={bit ? "binary-clock-dot on" : "binary-clock-dot"} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}