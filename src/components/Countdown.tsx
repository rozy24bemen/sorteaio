"use client";
import { useEffect, useMemo, useState } from "react";

interface CountdownProps { endsAt: string | number | Date }

export function Countdown({ endsAt }: CountdownProps) {
  const target = useMemo(() => new Date(endsAt).getTime(), [endsAt]);
  // Use remaining time state; initialize at 0 to keep render pure
  const [remainingMs, setRemainingMs] = useState(0);

  useEffect(() => {
    // Initial tick after mount
    const compute = () => setRemainingMs(Math.max(0, target - Date.now()));
    compute();
    const id = setInterval(compute, 1000);
    return () => clearInterval(id);
  }, [target]);

  const diff = remainingMs;
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
