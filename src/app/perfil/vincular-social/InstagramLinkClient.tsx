"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function InstagramLinkClient({ handle }: { handle: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function onRevoke() {
    setError(null);
    try {
      const res = await fetch("/api/oauth/instagram/link", { method: "DELETE" });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Error revocando acceso");
      }
      startTransition(() => router.refresh());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error revocando acceso";
      setError(msg);
    }
  }

  return (
    <div className="rounded-md border p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">Instagram conectado</p>
          <p className="font-medium">@{handle}</p>
        </div>
        <button
          onClick={onRevoke}
          disabled={pending}
          className="inline-flex items-center px-3 py-2 rounded-md border border-red-600 text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {pending ? "Revocando…" : "Desconectar"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
