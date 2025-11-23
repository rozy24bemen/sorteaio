"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type Mode = "login" | "register";

function AuthInner() {
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const initialMode = params.get("mode") === "register" ? "register" : "login";
  const initialType = params.get("accountType") === "BRAND" ? "BRAND" : "PARTICIPANT";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [accountType, setAccountType] = useState<"PARTICIPANT" | "BRAND">(initialType);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleRegister() {
    setError(null); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          accountType,
          company: accountType === "BRAND" ? { legalName: companyName || name || email.split("@")[0] } : undefined,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error de registro");
        return;
      }
      // Auto login después del registro
      const loginRes = await signIn("credentials", { email, password, callbackUrl: next, redirect: false });
      if (loginRes?.error) {
        setError(loginRes.error);
      } else {
        router.replace(loginRes?.url || next);
        router.refresh();
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error interno";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin() {
    setError(null); setLoading(true);
    try {
      const loginRes = await signIn("credentials", { email, password, callbackUrl: next, redirect: false });
      if (loginRes?.error) {
        setError(loginRes.error);
      } else {
        router.replace(loginRes?.url || next);
        router.refresh();
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Error interno";
      setError(message);
    } finally { setLoading(false); }
  }

  function social(provider: string) {
    signIn(provider, { callbackUrl: next });
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-center">SORTEA.IO</h1>
      <div className="mb-4 flex rounded-md overflow-hidden text-sm border">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 px-3 py-2 font-medium ${mode === "login" ? "bg-[var(--color-primary)] text-white" : "bg-transparent"}`}
        >Iniciar sesión</button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 px-3 py-2 font-medium ${mode === "register" ? "bg-[var(--color-primary)] text-white" : "bg-transparent"}`}
        >Registrarse</button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
        <button
          type="button"
          onClick={() => setAccountType("PARTICIPANT")}
          className={`rounded-md border px-3 py-2 ${accountType === "PARTICIPANT" ? "border-[var(--color-primary)]" : "border-gray-300"}`}
        >Participante</button>
        <button
          type="button"
          onClick={() => setAccountType("BRAND")}
          className={`rounded-md border px-3 py-2 ${accountType === "BRAND" ? "border-[var(--color-primary)]" : "border-gray-300"}`}
        >Marca</button>
      </div>

      <div className="grid gap-3">
        {/* Social logins */}
        <div className="grid gap-2">
          <button onClick={() => social("google")} className="w-full rounded-md bg-blue-600 px-3 py-2 text-white text-sm font-medium">Continuar con Google</button>
        </div>
        <div className="h-px bg-gray-200" />
        {/* Form */}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
        />
        {mode === "register" && (
          <>
            <input
              type="text"
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-md border px-3 py-2 text-sm"
            />
            {accountType === "BRAND" && (
              <input
                type="text"
                placeholder="Nombre legal de la marca"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="rounded-md border px-3 py-2 text-sm"
              />
            )}
          </>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="button"
          disabled={loading || !email || !password || (mode === "register" && accountType === "BRAND" && !companyName)}
          onClick={mode === "register" ? handleRegister : handleLogin}
          className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >{loading ? "Procesando..." : mode === "register" ? "Crear cuenta" : "Iniciar sesión"}</button>
      </div>
      <p className="mt-4 text-center text-[10px] text-[var(--color-fg-muted)]">Al continuar aceptas los Términos y la Política de privacidad.</p>
    </div>
  );
}

export default function UnifiedAuthPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-10">Cargando...</div>}>
      <AuthInner />
    </Suspense>
  );
}
