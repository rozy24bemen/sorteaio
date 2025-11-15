import { Suspense } from "react";
import OnboardingClient from "./onboardingClient";

export default function OnboardingEmpresaPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-10">Cargando…</div>}>
      <OnboardingClient />
    </Suspense>
  );
}
