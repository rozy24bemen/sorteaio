"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface RequirementDraft {
  id: string;
  type: "like" | "comment" | "mentions" | "follow";
  mentions?: number;
}

export default function CrearSorteoPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [requirements, setRequirements] = useState<RequirementDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function add(type: RequirementDraft["type"]) {
    setRequirements((r) => [...r, { id: crypto.randomUUID(), type }]);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.user) {
      setError("Debes estar autenticado");
      return;
    }

    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    // First, ensure user has a company (or fetch existing)
    let companyId = formData.get("companyId") as string;
    if (!companyId) {
      // Create company on-the-fly (simplified; in real app, separate onboarding)
      const companyRes = await fetch("/api/companies", { method: "GET" });
      const { companies } = await companyRes.json();
      if (companies?.length > 0) {
        companyId = companies[0].id;
      } else {
        setError("Debes completar onboarding empresa primero");
        setLoading(false);
        return;
      }
    }

    const payload = {
      title: formData.get("title"),
      description: formData.get("description"),
      network: formData.get("network"),
      postUrl: formData.get("postUrl"),
      startsAt: formData.get("startsAt"),
      endsAt: formData.get("endsAt"),
      companyId,
      requirements: requirements.map((r) => ({
        type: r.type,
        required: true,
        mentionsCount: r.type === "mentions" ? r.mentions ?? 2 : undefined,
      })),
    };

    try {
      const res = await fetch("/api/giveaways", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al crear sorteo");
      }

      const { giveaway } = await res.json();
      router.push(`/empresas/sorteos/${giveaway.id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Crear sorteo</h1>
      {error && <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700">{error}</div>}
      <form onSubmit={handleSubmit} className="grid gap-6">
        <section className="grid gap-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Detalles</h2>
          <input name="title" placeholder="Título" required className="rounded-md border px-3 py-2 text-sm" />
          <textarea name="description" placeholder="Descripción" required className="min-h-24 rounded-md border px-3 py-2 text-sm" />
          <div className="grid gap-2 sm:grid-cols-2">
            <input name="startsAt" type="datetime-local" required className="rounded-md border px-3 py-2 text-sm" />
            <input name="endsAt" type="datetime-local" required className="rounded-md border px-3 py-2 text-sm" />
          </div>
        </section>
        <section className="grid gap-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Publicación</h2>
          <select name="network" required className="rounded-md border px-3 py-2 text-sm">
            <option value="instagram">Instagram</option>
            <option value="x">X</option>
            <option value="tiktok">TikTok</option>
          </select>
          <input name="postUrl" placeholder="URL de la publicación" required className="rounded-md border px-3 py-2 text-sm" />
        </section>
        <section className="grid gap-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Requisitos de participación</h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => add("like")} className="rounded-full border px-3 py-1 text-xs">Like</button>
            <button type="button" onClick={() => add("comment")} className="rounded-full border px-3 py-1 text-xs">Comentario</button>
            <button type="button" onClick={() => add("mentions")} className="rounded-full border px-3 py-1 text-xs">Menciones</button>
            <button type="button" onClick={() => add("follow")} className="rounded-full border px-3 py-1 text-xs">Seguir (manual)</button>
          </div>
          <div className="grid gap-2">
            {requirements.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-md border p-2 text-xs">
                <span>{r.type === "mentions" ? `Menciones (${r.mentions ?? 2})` : r.type}</span>
                <button
                  type="button"
                  onClick={() => setRequirements((list) => list.filter((x) => x.id !== r.id))}
                  className="text-red-600"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[var(--color-fg-muted)]">El requisito de seguir se verifica manualmente tras la selección del ganador.</p>
        </section>
        <section className="grid gap-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Cláusulas</h2>
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" required /> <span>Acepto delegar la entrega y fiscalidad del premio.</span>
          </label>
          <label className="flex items-start gap-2 text-xs">
            <input type="checkbox" required /> <span>Entiendo que la plataforma no se hace cargo del premio.</span>
          </label>
        </section>
        <button disabled={loading} type="submit" className="rounded-full bg-[var(--color-secondary)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50">
          {loading ? "Creando..." : "Crear sorteo"}
        </button>
      </form>
    </div>
  );
}
