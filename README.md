<div align="center">
<h1>sortea.io</h1>
<strong>Plataforma de sorteos transparentes, verificados y con cumplimiento legal.</strong>
</div>

## 🧱 Stack

- Next.js 16 (App Router) + React 19
- TypeScript 5
- Tailwind CSS (v4 experimental, usando variables en `tokens.css`)
- ESLint + Type Checking (`npm run typecheck`)
- (Pendiente) Prisma + SQLite para desarrollo
- (Pendiente) Autenticación (NextAuth / custom OAuth)

## 📂 Arquitectura (MVP)

```
src/
	app/                Rutas (usuario + empresas)
	components/         UI reutilizable (Header, Card, Carousel...)
	domain/             Modelos de dominio TS
	design/             Tokens de diseño y theming
```

## 🚀 Scripts

```bash
npm run dev        # Desarrollo
npm run build      # Build producción
npm start          # Servir build
npm run lint       # Lint ESLint
npm run typecheck  # Revisión de tipos TS
```

## 🌐 Páginas Implementadas

Participante:
- `/` Home con destacados, sobre nosotros y listado con filtros (placeholder)
- `/login`, `/registro`
- `/sorteos/[id]` Página de detalle con requisitos, verificación manual follow y botón participar
- `/perfil` Información personal + historial
- `/mis-sorteos` Listado de participaciones

Sorteador (Cliente):
- `/empresas` Landing comercial con precios y métricas
- `/empresas/registro` Registro empresa
- `/empresas/onboarding` Flujo en 3 pasos (datos legales, RRSS, aceptación)
- `/empresas/dashboard` Métricas globales + listado sorteos
- `/empresas/crear` Formulario creación de sorteo (definición requisitos)
- `/empresas/sorteos/[id]` Analíticas internas del sorteo

## 🧪 Estado Actual

- Front de páginas y componentes base listo (sin persistencia real).
- Botón de participación simulado.
- Requisitos renderizados y bloque especial para seguimiento manual.
- No hay autenticación real aún.

## 🔐 Próximos Pasos (Roadmap)

1. Autenticación real (NextAuth con OAuth Google + Meta + X/TikTok si disponible)
2. Persistencia con Prisma (modelos User, Company, Giveaway, Requirement, Participation, WinnerSelection)
3. API Routes (App Router) para CRUD de sorteos y participaciones
4. Sistema de verificación automática (likes/comentarios) — investigar permisos de APIs oficiales
5. Paginación y filtros reales en listado de sorteos
6. Selección de ganador + verificación manual interactiva
7. Generación/almacenamiento de Bases Legales (plantillas + personalización)
8. Internacionalización (ES/EN)
9. Hardening de seguridad (rate limiting, validación de input, CSRF)
10. Deploy en Vercel y configuración de ambientes (.env.local, .env.production)

## 📄 Modelos de Dominio (Resumen)

Ver `src/domain/models.ts` para interfaces: User, CompanyAccount, Giveaway, Requirement, Participation, WinnerSelection.

## ⚠️ Notas Legales (MVP)

- El requisito "Seguir" no se puede verificar automáticamente en la mayoría de APIs públicas → se solicita confirmación del usuario y se audita al final.
- La plataforma no asume responsabilidad sobre la entrega del premio: cláusulas incluidas en creación.

## 🧩 Diseño / UI

- Tokens centrales en `src/design/tokens.css` (paleta, radios, spacing).
- Jerarquía clara para CTAs principales: "PARTICIPAR" y "Crear sorteo".
- Gamificación sutil mediante contador de participaciones y estados de requisitos.

## 🔧 Cómo Empezar

```bash
npm install # (si hace falta reinstalar)
npm run dev
```
Abrir `http://localhost:3000`.

## �️ Base de Datos (Prisma + SQLite)

Primer uso:

```bash
npx prisma generate
npx prisma db push
```

Opcional (UI DB):

```bash
npx prisma studio
```

Endpoint de salud BD: `GET /api/health` devuelve `{ ok, users, giveaways }`.

## � Autenticación (NextAuth + Google)

**Implementado:** NextAuth v5 con Google OAuth y Prisma adapter.

Archivos clave:
- `src/auth.ts` - Config NextAuth + PrismaAdapter
- `src/app/api/auth/[...nextauth]/route.ts` - Handler automático
- `src/components/Providers.tsx` - SessionProvider wrapper

Uso en cliente:
```tsx
import { useSession, signIn, signOut } from "next-auth/react";
const { data: session } = useSession();
```

Uso en servidor (App Router):
```tsx
import { auth } from "@/auth";
const session = await auth();
```

**Variables requeridas en `.env`:**
```bash
DATABASE_URL="file:./dev.db"
AUTH_SECRET=genera_con_openssl_rand_base64_32
GOOGLE_CLIENT_ID=tu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu_secret
```

Sesiones almacenadas en BD (tabla `Session`). Cuentas OAuth en `Account`.

## 🛡️ Variables de Entorno Completas

```bash
# Base de datos
DATABASE_URL="file:./dev.db"

# Autenticación
AUTH_SECRET=clave_secreta_larga_y_segura
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx

# Futuro: Meta, X, TikTok
# META_APP_ID=...
# META_APP_SECRET=...
```

## ✅ Checklist MVP Legal

- Bases visibles en página de sorteo
- Checkbox protección de datos
- Disclaimer verificación manual follow
- Aviso comprobación requisitos al ganador

## 🤝 Contribuir

Pull requests bienvenidos una vez definamos esquema Prisma. Por ahora centrado en estructurar el MVP.

---

© 2025 sortea.io
