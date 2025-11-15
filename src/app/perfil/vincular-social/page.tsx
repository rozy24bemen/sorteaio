import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import InstagramLinkClient from "./InstagramLinkClient";

export default async function VincularSocialPage() {
  const session = await auth();
  const igAccount = session?.user ? await prisma.socialAccount.findFirst({
    where: { userId: session.user.id, network: "instagram" },
    select: { handle: true },
  }) : null;

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Vincula tus cuentas sociales</h1>
      {!session?.user ? (
        <p>Debes iniciar sesión para vincular cuentas.</p>
      ) : (
        <div className="space-y-4">
          {!igAccount && (
            <>
              <p className="text-sm text-gray-600">Vincula tu Instagram para que podamos verificar tus comentarios y menciones automáticamente cuando participes.</p>
              <Link
                href="/api/oauth/instagram/start"
                className="inline-flex items-center px-4 py-2 rounded-md bg-black text-white hover:bg-gray-800"
                prefetch={false}
              >
                Conectar Instagram
              </Link>
            </>
          )}
          {igAccount && (
            <InstagramLinkClient handle={igAccount.handle} />
          )}
          <div className="mt-6 text-xs text-gray-500">
            <p>Nota: se solicitará el permiso <code>user_profile</code> de Instagram para obtener tu identificador de usuario.</p>
          </div>
        </div>
      )}
    </div>
  );
}
