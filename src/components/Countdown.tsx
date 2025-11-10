"use client";
import { useEffect, useMemo, useState } from "react";

export function Countdown({ endsAt }: { endsAt: string | number | Date }) {
  const target = useMemo(() => new Date(endsAt).getTime(), [endsAt]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = Math.max(0, target - now);
  const s = Math.floor(diff / 1000) % 60;
  const m = Math.floor(diff / (1000 * 60)) % 60;
  const h = Math.floor(diff / (1000 * 60 * 60)) % 24;
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
      ⏳ {d}d {h}h {m}m {s}s
    </span>
  );
}
