import Link from "next/link";
import { Carousel } from "@/components/Carousel";
import { GiveawayCard } from "@/components/GiveawayCard";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const featured = [
  { id: "f1", title: "iPhone 16 Pro Max" },
  { id: "f2", title: "PlayStation 5 + 2 mandos" },
  { id: "f3", title: "Viaje a Canarias" },
];

export default async function Home() {
  // Fetch active giveaways from DB
  const giveaways = await prisma.giveaway.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const list = giveaways.length ? giveaways.map((g) => ({
    id: g.id,
    title: g.title,
    shortDescription: g.description.substring(0, 60) + "...",
    endsAt: g.endsAt.toISOString(),
  })) : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      {/* Mini header / hero */}
      <section className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-fg)]">Sorteos transparentes y verificados</h1>
          <p className="text-sm text-[var(--color-fg-muted)]">Participa en minutos. Resultados claros.</p>
        </div>
        <Link href="/empresas" className="rounded-full bg-[var(--color-secondary)] px-4 py-2 text-sm font-semibold text-white">
          Para empresas
        </Link>
      </section>

      {/* Carousel destacados */}
      <section className="mb-8">
        <Carousel items={featured} />
      </section>

      {/* Sobre nosotros */}
      <section className="mb-8 grid gap-3 rounded-lg border bg-[var(--color-bg-soft)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-fg)]">¿Por qué sortea.io?</h2>
        <ul className="list-disc pl-5 text-sm text-[var(--color-fg-muted)]">
          <li>Sorteos 100% transparentes</li>
          <li>Verificación automática de interacciones disponibles</li>
          <li>Protección legal y bases claras</li>
        </ul>
      </section>

      {/* Listado con filtros (placeholder) */}
      <section className="mb-8">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <button className="rounded-full border px-3 py-1">Todos</button>
          <button className="rounded-full border px-3 py-1">Instagram</button>
          <button className="rounded-full border px-3 py-1">X</button>
          <button className="rounded-full border px-3 py-1">TikTok</button>
          <div className="ml-auto text-xs text-[var(--color-fg-muted)]">Paginación</div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((g) => (
            <GiveawayCard key={g.id} {...g} />
          ))}
        </div>
      </section>
    </div>
  );
}
