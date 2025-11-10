import Link from "next/link";
import { Countdown } from "@/components/Countdown";

export interface GiveawayCardProps {
  id: string;
  title: string;
  shortDescription: string;
  endsAt: string;
  image?: string;
  participations?: number;
}

export function GiveawayCard(props: GiveawayCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 shadow-sm bg-[var(--color-bg)]">
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 rounded-md bg-[var(--color-primary)]/15" />
        <div className="flex-1">
          <h3 className="text-base font-semibold text-[var(--color-fg)] line-clamp-2">{props.title}</h3>
          <p className="text-xs text-[var(--color-fg-muted)] line-clamp-2">{props.shortDescription}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <Countdown endsAt={props.endsAt} />
        <Link
          href={`/sorteos/${props.id}`}
          className="rounded-full bg-[var(--color-secondary)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90"
        >
          Ver sorteo
        </Link>
      </div>
    </div>
  );
}
