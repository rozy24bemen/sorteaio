"use client";
import { signIn } from "next-auth/react";

export default function RegistroPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Crear cuenta</h1>
      <div className="grid gap-4">
        <button onClick={() => signIn("google")} className="w-full rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">Registro con Google</button>
        <div className="h-px bg-gray-200" />
        <p className="text-xs text-[var(--color-fg-muted)]">El login social solo se usa para identificarte y validar interacciones. Nunca publicamos por ti.</p>
      </div>
    </div>
  );
}
