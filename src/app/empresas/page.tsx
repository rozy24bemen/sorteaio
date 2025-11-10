import Link from "next/link";

export default async function EmpresasLandingPage(context: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { error } = await context.searchParams;
  const noCompany = error === "no_company_account";
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      {/* Hero */}
      <section className="mb-10 grid gap-4 rounded-2xl bg-[var(--color-bg-soft)] p-8">
        {noCompany ? (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-fg)]">
              ¡Genial, ya tienes una cuenta! Ahora, activa tu Panel de Sorteador.
            </h1>
            <p className="max-w-2xl text-sm text-[var(--color-fg-muted)]">
              Parece que intentaste acceder al área de empresas. Para crear y gestionar tus sorteos, completa tu perfil como Sorteador.
            </p>
            <div className="flex gap-3">
              <Link href="/empresas/onboarding?step=1" className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white">Crear mi Cuenta de Empresa</Link>
              <a href="#precios" className="rounded-full border px-5 py-2 text-sm font-semibold">Ver precios</a>
            </div>
            <div className="mt-2 rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-3 text-xs text-[var(--color-fg-muted)]">
              Consejo: si ya tienes una empresa registrada con otro email, cierra sesión y vuelve a iniciar con la cuenta correcta.
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--color-fg)]">
              Haz crecer tu audiencia con sorteos verificados
            </h1>
            <p className="max-w-2xl text-sm text-[var(--color-fg-muted)]">
              Crea sorteos en minutos, cumple con la normativa y ofrece transparencia total a tu comunidad.
            </p>
            <div className="flex gap-3">
              <Link href="/empresas/registro" className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-sm font-semibold text-white">Empieza a sortear ahora</Link>
              <a href="#precios" className="rounded-full border px-5 py-2 text-sm font-semibold">Ver precios</a>
            </div>
          </>
        )}
      </section>

      {/* Argumentos de venta */}
      <section className="mb-10 grid gap-6 sm:grid-cols-3">
        {[
          { t: "Crecimiento verificado", d: "Validamos interacciones (likes/comentarios) cuando la API lo permite." },
          { t: "Cumplimiento legal", d: "Generamos bases y cláusulas para proteger a tu marca." },
          { t: "Analíticas claras", d: "Métricas de participación, alcance y cumplimiento." },
        ].map((b) => (
          <div key={b.t} className="rounded-lg border p-5">
            <h3 className="mb-1 text-lg font-semibold">{b.t}</h3>
            <p className="text-sm text-[var(--color-fg-muted)]">{b.d}</p>
          </div>
        ))}
      </section>

      {/* Infografías/Estadísticas (placeholder) */}
      <section className="mb-10 grid gap-4 rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Resultados de nuestros clientes</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-[var(--color-primary)]/10 p-4 text-center">
            <div className="text-3xl font-bold text-[var(--color-primary)]">+35%</div>
            <div className="text-xs text-[var(--color-fg-muted)]">Crecimiento de seguidores</div>
          </div>
          <div className="rounded-lg bg-[var(--color-primary)]/10 p-4 text-center">
            <div className="text-3xl font-bold text-[var(--color-primary)]">2.1x</div>
            <div className="text-xs text-[var(--color-fg-muted)]">Interacciones por post</div>
          </div>
          <div className="rounded-lg bg-[var(--color-primary)]/10 p-4 text-center">
            <div className="text-3xl font-bold text-[var(--color-primary)]">100%</div>
            <div className="text-xs text-[var(--color-fg-muted)]">Ganadores auditables</div>
          </div>
        </div>
      </section>

      {/* Precios */}
      <section id="precios" className="mb-10 grid gap-6 sm:grid-cols-3">
        {[
          { name: "Starter", price: "0€", feat: ["1 sorteo", "Bases legales genéricas", "Email soporte"] },
          { name: "Pro", price: "29€/mes", feat: ["Hasta 5 sorteos/mes", "Analíticas", "Soporte prioritario"] },
          { name: "Business", price: "Custom", feat: ["SLA", "Integraciones avanzadas", "Gestor dedicado"] },
        ].map((p) => (
          <div key={p.name} className="rounded-xl border p-6">
            <h3 className="text-lg font-semibold">{p.name}</h3>
            <div className="mb-3 text-3xl font-extrabold">{p.price}</div>
            <ul className="mb-4 list-disc pl-5 text-sm text-[var(--color-fg-muted)]">
              {p.feat.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Link href="/empresas/registro" className="inline-block rounded-full bg-[var(--color-secondary)] px-4 py-2 text-sm font-semibold text-white">Seleccionar</Link>
          </div>
        ))}
      </section>

      {/* Contacto */}
      <section className="grid gap-3 rounded-xl border p-6">
        <h2 className="text-lg font-semibold">Contacto para grandes empresas</h2>
        <p className="text-sm text-[var(--color-fg-muted)]">¿Necesitas algo a medida? Escríbenos y te contactamos en 24h.</p>
        <a href="mailto:hola@sortea.io" className="w-max rounded-full border px-4 py-2 text-sm">hola@sortea.io</a>
      </section>
    </div>
  );
}
