import { Countdown } from "@/components/Countdown";
import { LegalLinks } from "@/components/LegalLinks";
import { ManualFollowBlock, RequirementBlock, Requirement } from "@/components/RequirementBlock";
import { ParticipateButton } from "@/components/ParticipateButton";
import Link from "next/link";

// Mock fetch
async function getGiveaway(id: string) {
  return {
    id,
    title: "Sorteo iPhone 16 Pro Max",
    creator: { id: "c1", name: "@tienda_oficial" },
    description:
      "Gana un iPhone 16 Pro Max. Requisitos: Like, Comentario con 2 menciones y seguir la cuenta.",
    endsAt: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    basesUrl: "#",
    requirements: [
      { id: "r1", type: "like", label: "Dar like a la publicación", required: true },
      { id: "r2", type: "comment", label: "Comentar con 2 menciones", required: true, mentionsCount: 2 },
      { id: "r3", type: "follow", label: "Seguir a @tienda_oficial", required: true, link: "https://instagram.com/tienda_oficial" },
    ] as Requirement[],
  };
}

export default async function GiveawayPage(context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const data = await getGiveaway(id);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* 3.1 Información esencial */}
      <div className="mb-6 grid gap-3">
        <h1 className="text-2xl font-bold text-[var(--color-fg)]">{data.title}</h1>
        <div className="flex items-center gap-3 text-sm text-[var(--color-fg-muted)]">
          <span>Por <Link href={`/perfil/${data.creator.id}`} className="font-semibold text-[var(--color-primary)]">{data.creator.name}</Link></span>
          <Countdown endsAt={data.endsAt} />
        </div>
      </div>

      {/* 3.2 Detalles participación */}
      <div className="mb-6 grid gap-2 rounded-lg border bg-[var(--color-bg-soft)] p-4">
        <p className="text-sm text-[var(--color-fg)]">{data.description}</p>
        <LegalLinks basesUrl={data.basesUrl} />
        <label className="mt-1 flex items-start gap-2 text-xs text-[var(--color-fg-muted)]">
          <input type="checkbox" className="mt-0.5" />
          <span>He leído y acepto la cláusula de Protección de Datos.</span>
        </label>
      </div>

      {/* 3.3 Bloques de participación */}
      <div className="mb-4 grid gap-3">
        {data.requirements.filter(r=>r.type!=="follow").map((r) => (
          <RequirementBlock key={r.id} r={r} />
        ))}
      </div>

      {/* 3.4 Muro de verificación manual (seguir) */}
      {data.requirements.some((r)=> r.type === "follow") && (
        <div className="mb-6">
          <ManualFollowBlock profileLabel={data.creator.name} profileUrl={data.requirements.find(r=>r.type==="follow")?.link || "#"} />
        </div>
      )}

      {/* 3.5 Participación final */}
      <div className="sticky bottom-4 z-20 mx-auto max-w-4xl rounded-xl border bg-white p-4 shadow-lg">
        <ParticipateButton initialState="ready" totalEntries={3} />
        <p className="mt-2 text-center text-[11px] text-[var(--color-fg-muted)]">
          Los requisitos se comprobarán al ganador; si no cumple, se elige suplente.
        </p>
      </div>
    </div>
  );
}
