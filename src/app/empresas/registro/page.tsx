export default function RegistroEmpresaPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Registro para sorteadores</h1>
      <div className="grid gap-4">
        <button className="w-full rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">Login con Google</button>
        <button className="w-full rounded-md bg-[var(--color-primary)]/80 px-4 py-2 text-sm font-semibold text-white">Login con Meta</button>
        <div className="h-px bg-gray-200" />
        <form className="grid gap-3">
          <input type="text" placeholder="Nombre de contacto" className="rounded-md border px-3 py-2 text-sm" />
          <input type="email" placeholder="Email corporativo" className="rounded-md border px-3 py-2 text-sm" />
          <input type="password" placeholder="Contraseña" className="rounded-md border px-3 py-2 text-sm" />
          <button className="rounded-md bg-[var(--color-secondary)] px-4 py-2 text-sm font-semibold text-white">Crear cuenta empresa</button>
        </form>
        <p className="text-xs text-[var(--color-fg-muted)]">Verifica tu email para activar la cuenta.</p>
      </div>
    </div>
  );
}
