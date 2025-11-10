<div align="center">
<h1>sortea.io</h1>
<strong>Plataforma de sorteos transparentes, verificados y con cumplimiento legal.</strong>
<br/>
<em>MVP en desarrollo activo</em>
</div>

## Tabla de Contenidos
1. Visión General
2. Stack Técnico
3. Arquitectura y Estructura de Carpetas
4. Puesta en Marcha (Setup Local)
5. Variables de Entorno
6. Base de Datos y Prisma
7. Autenticación (NextAuth v5)
8. Rutas Principales y Flujos
9. Modelos de Dominio
10. API (Resumen de Endpoints)
11. Seguridad y Middleware
12. CI / Calidad
13. Roadmap
14. Checklist Legal MVP
15. Troubleshooting
16. Contribución

---

## 1. Visión General
Sortea.io busca reducir la fricción para crear sorteos transparentes y auditables: gestión de requisitos, selección de ganadores, métricas de participación y cumplimiento legal estandarizado.

## 2. Stack Técnico
- Next.js 16 (App Router, Server Components)
- React 19
- TypeScript 5 (estricto)
- Tailwind CSS v4 (tokens propios en `tokens.css`)
- Prisma ORM + SQLite (desarrollo) → migrable a Postgres
- NextAuth v5 (Google OAuth + Prisma Adapter)
- ESLint + Typecheck + GitHub Actions CI

## 3. Arquitectura y Estructura
```
src/
	app/                  Páginas y rutas (public + empresas)
	components/           UI reutilizable (Header, Countdown, etc.)
	domain/               Modelos de dominio TS (interfaces)
	design/               Tokens y estilos globales
	lib/                  Helpers (Prisma, auth helpers)
```
Prisma: `prisma/schema.prisma`, migraciones en `prisma/migrations/*`.

## 4. Puesta en Marcha
```bash
npm install
npx prisma generate
npx prisma db push   # crea tablas en dev.db
npm run dev          # http://localhost:3000
```
Semilla opcional:
```bash
npm run db:seed
```

## 5. Variables de Entorno
Crear `.env.local`:
```bash
DATABASE_URL="file:./dev.db"            # o ruta absoluta si error code 14
AUTH_SECRET="openssl rand -base64 32"   # secreto NextAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="xxxxx"
```
Para producción usar un proveedor (Postgres) y regenerar migraciones.

## 6. Base de Datos y Prisma
- Ejecutar `npx prisma migrate dev` para crear migraciones formales.
- Modelos: User, CompanyAccount, Giveaway, Requirement, Participation, WinnerSelection, WinnerBackup.
- Relaciones: `CompanyAccount` → `Giveaway[]`, `Giveaway` → `Requirement[]`, `Participation` → `Giveaway`.
- Semilla en `prisma/seed.ts` crea usuario demo + empresa + sorteos.

## 7. Autenticación (NextAuth v5)
Archivos clave:
- `src/auth.ts` configuración + callbacks (enrich `session.user.isCompany`).
- `src/app/api/auth/[...nextauth]/route.ts` handlers GET/POST (envoltura CSP dev).
- `src/components/Providers.tsx` para SessionProvider.

Uso cliente:
```tsx
const { data: session, update } = useSession();
```
Refresco silencioso tras crear empresa: `update()`.

Uso servidor:
```tsx
const session = await auth();
```

## 8. Rutas y Flujos Principales
Participante:
- `/` listado / destacados
- `/sorteos/[id]` detalle + requisitos + participar
- `/mis-sorteos` resumen participaciones

Empresa:
- `/empresas` landing + CTA onboarding
- `/empresas/onboarding` creación de CompanyAccount (paso legal implementado)
- `/empresas/dashboard` métricas (activos, finalizados, totales, participantes)
- `/empresas/crear` crear sorteo (estructura base)
- `/empresas/sorteos/[id]` analíticas sorteo

Protección vía middleware: rutas de empresa redirigen a login o onboarding.

## 9. Modelos de Dominio
Ver `src/domain/models.ts`. Campos clave:
- `Giveaway.status`: `draft | active | finished`
- `Requirement.type`: `follow | like | comment | share | tag | custom`

## 10. API Endpoints (Resumen)
- `POST /api/companies` crear CompanyAccount
- `GET /api/companies` listar empresas del usuario
- `GET /api/giveaways` listar sorteos
- `POST /api/giveaways` crear sorteo (validación básica)
- `GET /api/giveaways/:id` detalle
- `PATCH /api/giveaways/:id` actualizar
- `DELETE /api/giveaways/:id` borrar
- `POST /api/participations` registrar participación (si activo)
- `GET /api/health` info rápida BD

Autorización básica: ownership de sorteo en updates/delete.

## 11. Seguridad y Middleware
`src/middleware.ts`:
- Redirige no autenticados a `/login?next=...`
- Redirige usuarios sin empresa a `/empresas?error=no_company_account`
- Usa `session.user.isCompany` (evita consultas DB en edge).

Dev CSP: handler auth añade `'unsafe-eval'` sólo en desarrollo para evitar bloqueo de overlay.

## 12. CI / Calidad
GitHub Actions (`.github/workflows/ci.yml`):
- Trigger en push/PR a `main`.
- Jobs: lint (`next lint` sin warnings), typecheck (TS), prisma generate.

## 13. Roadmap (Prioridades Próximas)
1. Ganador + backup + lógica aleatoria justa
2. Verificación requisitos (API redes sociales) + fallback manual
3. Métricas avanzadas (CTR requisitos, retención, crecimiento neto) en dashboard
4. Paginación, búsqueda y filtros multi-campo
5. Internacionalización (ES/EN)
6. Deploy continuo (Vercel) tras CI verde
7. Tests unitarios y de integración (Playwright / Vitest) para APIs y flujos críticos
8. Generación automática de bases legales y almacenamiento versión

## 14. Checklist Legal MVP
- Bases visibles y accesibles
- Consentimiento datos personales (checkbox)
- Aviso verificación manual follow
- Registro de selección de ganador (timestamp + hash)
- Opción de suplente (WinnerBackup)

## 15. Troubleshooting
| Problema | Causa Común | Solución |
|----------|-------------|----------|
| Error SQLite code 14 | Ruta relativa en Windows | Usar `file:./dev.db` o ruta absoluta en `DATABASE_URL` |
| 405 en auth | Handlers NextAuth mal exportados | Ver `src/app/api/auth/[...nextauth]/route.ts` |
| Badge empresa no aparece tras crear | Sesión sin refresco | Usar `update()` tras POST empresa |
| CSP bloquea sign-in dev | script-src estricto | Wrapper añade `'unsafe-eval'` en dev |
| Participación en sorteo draft | Falta validación | Endpoint rechaza si `status !== active` |

## 16. Contribución
PRs bienvenidos. Antes de abrir uno:
1. Crear rama feature.
2. Ejecutar `npm run lint` y `npm run typecheck`.
3. Añadir tests si modificas lógica de negocio (cuando framework de tests esté añadido).
4. Describir claramente cambios y motivación.

Licencia: Pendiente de definir (probablemente MIT o Propietaria en fase inicial).

---

© 2025 sortea.io
