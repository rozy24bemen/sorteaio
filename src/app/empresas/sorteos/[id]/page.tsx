import { auth } from "@/auth";
import { redirect } from "next/navigation";
// Página interna de analíticas de un sorteo (no pública)
export default async function SorteoAnalyticsPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || !session.user.isCompany) {
    redirect(`/login?next=/empresas/sorteos/${params.id}`);
  }
  // Mock datos analíticos
  const data = {
    id: params.id,
    title: "Sorteo iPhone 16 Pro Max",
    participants: 820,
    interactions: {
      likes: 1500,
      comments: 420,
      mentionsAvg: 1.8,
    },
    status: "En curso",
  };
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold">Analíticas: {data.title}</h1>
      <div className="mb-6 rounded-lg border p-4 text-sm">
        <div className="flex flex-wrap gap-6">
          <div>
            <div className="text-xs text-[var(--color-fg-muted)]">Participantes</div>
            <div className="text-xl font-bold">{data.participants.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-fg-muted)]">Likes</div>
            <div className="text-xl font-bold">{data.interactions.likes.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-fg-muted)]">Comentarios</div>
            <div className="text-xl font-bold">{data.interactions.comments.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-fg-muted)]">Menciones promedio</div>
            <div className="text-xl font-bold">{data.interactions.mentionsAvg}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-fg-muted)]">Estado</div>
            <div className="text-xl font-bold">{data.status}</div>
          </div>
        </div>
      </div>
      <section className="grid gap-4">
        <h2 className="text-lg font-semibold">Acciones</h2>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-full border px-4 py-2 text-xs">Refrescar datos</button>
          <button className="rounded-full border px-4 py-2 text-xs">Exportar CSV</button>
          <button className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white">Seleccionar ganador</button>
        </div>
        <p className="text-[11px] text-[var(--color-fg-muted)]">La selección de ganador ejecutará la verificación manual en requisitos no auditables por API (seguir, etc.).</p>
      </section>
    </div>
  );
}
