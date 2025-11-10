"use client";
import { useState } from "react";

type State = "disabled" | "ready" | "submitting" | "done";

export function ParticipateButton({
  initialState = "disabled",
  totalEntries = 0,
}: {
  initialState?: State;
  totalEntries?: number;
}) {
  const [state, setState] = useState<State>(initialState);

  const label =
    state === "disabled"
      ? "Completa los requisitos"
      : state === "ready"
      ? `Participar (${totalEntries})`
      : state === "submitting"
      ? "Enviando…"
      : "¡Participación confirmada!";

  return (
    <button
      disabled={state === "disabled" || state === "submitting"}
      onClick={() => {
        if (state !== "ready") return;
        setState("submitting");
        setTimeout(() => setState("done"), 1000);
      }}
      className={`w-full rounded-lg px-4 py-3 text-center text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)] ${
        state === "disabled"
          ? "cursor-not-allowed bg-gray-300 text-gray-600"
          : state === "submitting"
          ? "bg-[var(--color-primary)] text-white opacity-80"
          : state === "done"
          ? "bg-[var(--color-success)] text-white"
          : "bg-[var(--color-primary)] text-white hover:opacity-90"
      }`}
    >
      {label}
    </button>
  );
}
