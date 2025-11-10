export function LegalLinks({ basesUrl = "#" }: { basesUrl?: string }) {
  return (
    <div className="text-xs text-[var(--color-fg-muted)]">
      <a href={basesUrl} className="underline hover:text-[var(--color-primary)]">
        Bases Legales
      </a>
      {" • "}
      <a href="#" className="underline hover:text-[var(--color-primary)]">
        Política de privacidad
      </a>
      {" • "}
      <a href="#" className="underline hover:text-[var(--color-primary)]">
        Términos de uso
      </a>
    </div>
  );
}
