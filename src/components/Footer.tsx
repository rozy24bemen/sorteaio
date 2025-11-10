export function Footer() {
  return (
    <footer className="border-t bg-[var(--color-bg-soft)]">
      <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-[var(--color-fg-muted)] sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row">
          <p>
            © {new Date().getFullYear()} sortea.io — Transparente, fácil y divertido.
          </p>
          <nav className="flex flex-wrap gap-4">
            <a href="#" className="hover:text-[var(--color-primary)]">Bases legales</a>
            <a href="#" className="hover:text-[var(--color-primary)]">Política de privacidad</a>
            <a href="#" className="hover:text-[var(--color-primary)]">Términos y condiciones</a>
            <a href="/empresas" className="hover:text-[var(--color-primary)]">Para empresas</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
