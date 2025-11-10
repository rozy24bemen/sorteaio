"use client";
import { useState } from "react";

export interface Requirement {
  id: string;
  type: "like" | "comment" | "mentions" | "follow";
  label: string;
  required?: boolean;
  mentionsCount?: number;
  link?: string; // link to post or profile
}

export function RequirementBlock({ r }: { r: Requirement }) {
  const [done, setDone] = useState(false);
  const base = "flex items-center justify-between gap-4 rounded-md border p-3";
  if (r.type === "follow") {
    // Defer to ManualFollowBlock for special handling
    return null;
  }
  return (
    <div className={`${base} ${done ? "border-green-300" : "border-gray-200"}`}>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-[var(--color-fg)]">{r.label}</span>
        <span className="text-xs text-[var(--color-fg-muted)]">{r.required ? "Obligatorio" : "Opcional"}</span>
      </div>
      <button
        onClick={() => setDone(true)}
        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
          done ? "bg-[var(--color-success)] text-white" : "bg-[var(--color-primary)] text-white"
        }`}
      >
        {done ? "¡Hecho!" : "Validar"}
      </button>
    </div>
  );
}

export function ManualFollowBlock({
  profileLabel,
  profileUrl,
}: {
  profileLabel: string;
  profileUrl: string;
}) {
  const [confirmed, setConfirmed] = useState(false);
  return (
    <div className="flex flex-col gap-2 rounded-md border border-gray-200 p-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-sm font-medium text-[var(--color-fg)]">Seguir a {profileLabel}</span>
          <div className="text-xs text-[var(--color-fg-muted)]">
            No verificable por API — verificación manual al elegir ganador.
          </div>
        </div>
        <a
          href={profileUrl}
          target="_blank"
          className="rounded-full bg-[var(--color-secondary)] px-3 py-1.5 text-xs font-semibold text-white"
        >
          Abrir perfil
        </a>
      </div>
      <label className="flex items-start gap-2 text-xs text-[var(--color-fg-muted)]">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        <span>
          Confirmo que sigo a {profileLabel} y acepto la verificación manual posterior.
        </span>
      </label>
    </div>
  );
}
