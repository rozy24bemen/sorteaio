export default function PerfilPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Mi perfil</h1>
      <div className="grid gap-6">
        <section className="grid gap-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Información personal</h2>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[var(--color-primary)]/20" />
            <div className="flex-1 text-sm">
              <p className="font-medium">Usuario Demo</p>
              <p className="text-[var(--color-fg-muted)]">demo@example.com</p>
            </div>
          </div>
          <div className="grid gap-2 text-xs text-[var(--color-fg-muted)]">
            <span>Cuentas vinculadas:</span>
            <ul className="list-disc pl-5">
              <li>Instagram (lectura)</li>
              <li>Google (login)</li>
            </ul>
          </div>
        </section>
        <section className="grid gap-3 rounded-lg border p-4">
          <h2 className="text-lg font-semibold">Historial</h2>
          <ul className="space-y-2 text-sm text-[var(--color-fg-muted)]">
            <li>Participaste en Sorteo #1</li>
            <li>Participaste en Sorteo #2</li>
            <li>Ganaste Sorteo #3 (pendiente verificación)</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
