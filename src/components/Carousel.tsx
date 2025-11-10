"use client";
import { useState } from "react";

interface CarouselItem {
  id: string;
  title: string;
  image?: string;
}

export function Carousel({ items }: { items: CarouselItem[] }) {
  const [index, setIndex] = useState(0);
  if (!items.length) return null;
  const current = items[index];
  return (
    <div className="relative w-full overflow-hidden rounded-lg border bg-[var(--color-bg-soft)] p-4">
      <div className="flex items-center gap-4">
        <div className="h-24 w-24 flex-shrink-0 rounded-md bg-[var(--color-primary)]/10" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--color-fg)]">{current.title}</h3>
          <p className="text-xs text-[var(--color-fg-muted)]">Sorteo destacado #{index + 1}</p>
        </div>
      </div>
      <div className="absolute inset-y-0 left-0 flex items-center">
        <button
          onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
          className="rounded-full bg-white/80 px-2 py-1 text-sm shadow hover:bg-white"
        >
          ‹
        </button>
      </div>
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          onClick={() => setIndex((i) => (i + 1) % items.length)}
          className="rounded-full bg-white/80 px-2 py-1 text-sm shadow hover:bg-white"
        >
          ›
        </button>
      </div>
    </div>
  );
}
