import { redirect } from "next/navigation";

export default function RegistroEmpresaPage() {
  // Redirect legacy empresa registro page to unified auth
  redirect("/login?mode=register&accountType=BRAND&next=/empresas/onboarding");
}
