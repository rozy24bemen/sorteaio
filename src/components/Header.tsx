"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";

export function Header() {
  const pathname = usePathname();
  const isEmpresas = pathname?.startsWith("/empresas");
  const { data: session } = useSession();
  return (
    <header className="sticky top-0 z-30 border-b bg-[var(--color-bg)]/90 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg)]/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-block h-8 w-8 rounded-lg bg-[var(--color-primary)]" />
          <span className="text-lg font-semibold text-[var(--color-fg)]">sortea.io</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/" className="hover:text-[var(--color-primary)]">Inicio</Link>
          <Link href="/mis-sorteos" className="hover:text-[var(--color-primary)]">Mis sorteos</Link>
          <Link href="/perfil" className="hover:text-[var(--color-primary)]">Mi perfil</Link>
          <Link
            href="/empresas"
            className={`rounded-full px-3 py-1.5 text-white ${
              isEmpresas ? "bg-[var(--color-primary)]" : "bg-[var(--color-secondary)]"
            }`}
          >
            Para empresas
          </Link>
          {session?.user ? (
            <div className="flex items-center gap-2">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "avatar"}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full border object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
              <span className="hidden sm:inline text-[var(--color-fg-muted)] max-w-[120px] truncate">
                {session.user.name || session.user.email}
              </span>
              {session.user.isCompany && (
                <span className="rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-primary)]">
                  Empresa
                </span>
              )}
              <button
                onClick={() => signOut()}
                className="rounded-full border px-3 py-1.5 hover:bg-[var(--color-bg-soft)]"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("google")}
              className="rounded-full border px-3 py-1.5 hover:bg-[var(--color-bg-soft)]"
            >
              Acceder
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
