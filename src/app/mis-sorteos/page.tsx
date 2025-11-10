import Link from "next/link";

const participations = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  giveawayTitle: `Sorteo ${i + 1}`,
  entries: 3 + i,
  status: i === 2 ? "Ganador (verificación)" : "No ganador",
}));

export default function MisSorteosPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Mis sorteos</h1>
      <div className="grid gap-4">
        {participations.map((p) => (
          <div key={p.id} className="flex flex-col gap-2 rounded-lg border p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">{p.giveawayTitle}</span>
              <Link href={`/sorteos/${p.id}`} className="text-[var(--color-primary)] underline">Ver</Link>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-[var(--color-fg-muted)]">
              <span>Participaciones: {p.entries}</span>
              <span>Estado: {p.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
