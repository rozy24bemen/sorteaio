"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function RegistroEmpresaPage() {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const router = useRouter();

  async function handleGoogle() {
    try {
      setLoadingGoogle(true);
      // Redirect directly to onboarding after successful auth
      await signIn("google", { callbackUrl: "/empresas/onboarding?step=1" });
    } finally {
      setLoadingGoogle(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Registro para sorteadores</h1>
      <div className="grid gap-4">
        <button
          onClick={handleGoogle}
          disabled={loadingGoogle}
          className="w-full rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loadingGoogle ? "Conectando…" : "Login con Google"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/empresas/onboarding?step=1")}
          className="w-full rounded-md bg-[var(--color-primary)]/80 px-4 py-2 text-sm font-semibold text-white"
        >
          Login con Meta (próximamente)
        </button>
        <div className="h-px bg-gray-200" />
        <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); router.push("/empresas/onboarding?step=1"); }}>
          <input type="text" placeholder="Nombre de contacto" className="rounded-md border px-3 py-2 text-sm" />
          <input type="email" placeholder="Email corporativo" className="rounded-md border px-3 py-2 text-sm" />
          <input type="password" placeholder="Contraseña" className="rounded-md border px-3 py-2 text-sm" />
          <button className="rounded-md bg-[var(--color-secondary)] px-4 py-2 text-sm font-semibold text-white">Crear cuenta empresa</button>
        </form>
        <p className="text-xs text-[var(--color-fg-muted)]">Verifica tu email para activar la cuenta.</p>
      </div>
    </div>
  );
}
