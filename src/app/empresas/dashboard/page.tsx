import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function DashboardEmpresaPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const company = userId
    ? await prisma.companyAccount.findFirst({
        where: { ownerUserId: userId },
        include: {
          giveaways: {
            include: { _count: { select: { participations: true } } },
            orderBy: { createdAt: "desc" },
          },
        },
      })
    : null;
  if (!company) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p>No hay empresas registradas. <Link href="/empresas/onboarding" className="text-[var(--color-primary)] underline">Completa el onboarding</Link>.</p>
      </div>
    );
  }

  const giveaways = company.giveaways;
  const totalParticipants = giveaways.reduce((acc, g) => acc + g._count.participations, 0);
  const active = giveaways.filter((g) => g.status === "active").length;
  const finished = giveaways.filter((g) => g.status === "finished").length;
  const totalGiveaways = giveaways.length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis sorteos (Empresa)</h1>
        <Link href="/empresas/crear" className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">Crear nuevo sorteo</Link>
      </div>
      <section className="mb-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-xs text-[var(--color-fg-muted)]">Total participantes</div>
          <div className="text-2xl font-extrabold">{totalParticipants.toLocaleString()}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-xs text-[var(--color-fg-muted)]">Sorteos activos</div>
          <div className="text-2xl font-extrabold">{active}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-xs text-[var(--color-fg-muted)]">Sorteos finalizados</div>
          <div className="text-2xl font-extrabold">{finished}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-xs text-[var(--color-fg-muted)]">Sorteos totales</div>
          <div className="text-2xl font-extrabold">{totalGiveaways}</div>
        </div>
      </section>
      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">Sorteos</h2>
        <div className="grid gap-3">
          {giveaways.map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-lg border p-4 text-sm">
              <div>
                <div className="font-medium">{g.title}</div>
                <div className="text-[var(--color-fg-muted)]">Estado: {g.status} · {g._count.participations} participaciones</div>
              </div>
              <div className="flex gap-3">
                <Link href={`/empresas/sorteos/${g.id}`} className="text-[var(--color-primary)] underline">Analíticas</Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
