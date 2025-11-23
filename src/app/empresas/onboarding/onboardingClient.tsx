"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function OnboardingClient() {
  const search = useSearchParams();
  const initialStep = useMemo(() => {
    const s = Number(search.get("step") || 1);
    return Number.isFinite(s) && s >= 1 && s <= 3 ? s : 1;
  }, [search]);
  const [step, setStep] = useState(initialStep);

  const { data: session, update } = useSession();
  const [legalName, setLegalName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [fiscalAddress, setFiscalAddress] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email && !contactEmail) setContactEmail(session.user.email);
  }, [session?.user?.email, contactEmail]);

  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/companies");
        if (!res.ok) return;
        const data = await res.json();
        const first = Array.isArray(data.companies) ? data.companies[0] : null;
        setCompanyId(first?.id ?? null);
      } catch {}
    }
    if (step === 2) loadCompanies();
  }, [step]);

  async function handleCreateCompany(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legalName, taxId, fiscalAddress, contactEmail }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Error ${res.status}`);
      }
      try {
        await update();
      } catch (updateErr) {
        console.warn("[onboarding] session update failed", updateErr);
      }
      router.replace("/empresas/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear la empresa";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-2xl font-bold">Onboarding empresa</h1>
      <p className="mb-6 text-sm text-[var(--color-fg-muted)]">Completa los datos para comenzar a crear sorteos.</p>
      <div className="mb-4 flex gap-2 text-xs">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 rounded-full px-3 py-1 text-center font-semibold ${
              s === step ? "bg-[var(--color-primary)] text-white" : "bg-gray-200"
            }`}
          >
            Paso {s}
          </div>
        ))}
      </div>
      {step === 1 && (
        <section className="grid gap-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Datos legales</h2>
          {error && <div className="rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700">{error}</div>}
          <form className="grid gap-3" onSubmit={handleCreateCompany}>
            <label className="grid gap-1 text-xs">
              <span className="text-[var(--color-fg-muted)]">CIF/NIF</span>
              <input
                required
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="B12345678"
                className="rounded-md border px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1 text-xs">
              <span className="text-[var(--color-fg-muted)]">Razón social</span>
              <input
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Mi Marca S.L."
                className="rounded-md border px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1 text-xs">
              <span className="text-[var(--color-fg-muted)]">Domicilio fiscal</span>
              <input
                value={fiscalAddress}
                onChange={(e) => setFiscalAddress(e.target.value)}
                placeholder="Calle Mayor 1, Madrid"
                className="rounded-md border px-3 py-2 text-sm"
              />
            </label>
            <label className="grid gap-1 text-xs">
              <span className="text-[var(--color-fg-muted)]">Email de contacto</span>
              <input
                required
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="empresa@mi-marca.com"
                className="rounded-md border px-3 py-2 text-sm"
              />
            </label>
            <div className="mt-2 flex gap-2">
              <button
                disabled={loading}
                type="submit"
                className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {loading ? "Creando..." : "Crear empresa y continuar"}
              </button>
              <button type="button" onClick={() => setStep(2)} className="rounded-md border px-4 py-2 text-sm font-semibold">Omitir</button>
            </div>
          </form>
        </section>
      )}
      {step === 2 && (
        <section className="grid gap-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Integración RRSS</h2>
          {companyId ? (
            <a
              href={`/api/oauth/meta/start?companyId=${encodeURIComponent(companyId)}`}
              className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
            >
              Conectar Meta
            </a>
          ) : (
            <button
              disabled
              className="rounded-md bg-gray-300 px-4 py-2 text-sm font-semibold text-white"
              title="Crea una empresa en el Paso 1 para conectar Meta"
            >
              Conectar Meta
            </button>
          )}
          <button className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">Conectar X</button>
          <button className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">Conectar TikTok</button>
          <p className="text-xs text-[var(--color-fg-muted)]">Necesitamos token de larga duración para lectura de datos.</p>
          <button onClick={() => setStep(3)} className="mt-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">Continuar</button>
        </section>
      )}
      {step === 3 && (
        <section className="grid gap-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Aceptación legal</h2>
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" /> <span>Acepto los Términos de Uso y Condiciones de Contratación.</span>
          </label>
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" /> <span>Acepto la Política de Privacidad.</span>
          </label>
          <button onClick={() => router.replace("/empresas/dashboard")} className="mt-2 rounded-md bg-[var(--color-secondary)] px-4 py-2 text-sm font-semibold text-white">Finalizar</button>
        </section>
      )}
    </div>
  );
}
