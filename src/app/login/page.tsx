"use client";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Suspense } from "react";

function LoginForm() {
  const params = useSearchParams();
  const error = params.get("error");
  const next = params.get("next");
  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold">Accede a tu cuenta</h1>
      <div className="grid gap-4">
        <button
          onClick={() => signIn("google", { callbackUrl: next || "/" })}
          className="block w-full rounded-md bg-[var(--color-primary)] px-4 py-2 text-center text-sm font-semibold text-white"
          type="button"
        >
          Login con Google
        </button>
        <div className="h-px bg-gray-200" />
        <p className="text-xs text-[var(--color-fg-muted)]">El acceso con Google solo se usa para identificarte. No publicamos nada.</p>
        {error && <p className="text-xs text-red-600">Error: {error}</p>}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-10">Cargando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
