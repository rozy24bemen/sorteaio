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
17. Despliegue en Vercel

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
# Instagram (vinculación de participantes vía Basic Display API)
INSTAGRAM_APP_ID="..."
INSTAGRAM_APP_SECRET="..."
# Opcional
INSTAGRAM_REDIRECT_URI="https://tu-dominio.com/api/oauth/instagram/callback"
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
- `/perfil/vincular-social` vincular Instagram (para verificación de comentarios/mentions)

Empresa:
- `/empresas` landing + CTA onboarding
- `/empresas/onboarding` creación de CompanyAccount (paso legal implementado)
- `/empresas/dashboard` métricas (activos, finalizados, totales, participantes)
- `/empresas/crear` crear sorteo (estructura base)
- `/empresas/sorteos/[id]` analíticas sorteo

Protección vía middleware: rutas de empresa redirigen a login o onboarding.

## 9. Modelos de Dominio
Ver `src/domain/models.ts`. Campos clave:
- `Giveaway.status`: `draft | active | awaiting_winner | finished`
- `Requirement.type`: `follow | like | comment | share | tag | custom`

## 10. API Endpoints (Resumen)
- `POST /api/companies` crear CompanyAccount
- `GET /api/companies` listar empresas del usuario
- `GET /api/giveaways` listar sorteos
- `POST /api/giveaways` crear sorteo (validación básica)
- `GET /api/giveaways/:id` detalle
- `PATCH /api/giveaways/:id` actualizar
- `DELETE /api/giveaways/:id` borrar
- `POST /api/giveaways/:id/select-winner` seleccionar ganador y suplentes (cuando terminó)
- `POST /api/participations` registrar participación (si activo)
- `POST /api/participations/:id/verify` verificar requisitos de una participación (mock por ahora)
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
3. Integración Meta/Instagram real: OAuth 2.0 + lectura de likes/comentarios (Graph API)
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
| `cookies()` fuera de request | Llamada de pruebas sin contexto Next | Usar `req.cookies` y `NextResponse.cookies` en handlers |

## Integración Meta/Instagram (WIP → Adapter real)

Variables de entorno:
```
META_APP_ID="..."
META_APP_SECRET="..."
# Opcional (override)
META_REDIRECT_URI="https://tu-dominio.com/api/oauth/meta/callback"
```

Flujo:
1) Onboarding Paso 2 muestra botón “Conectar Meta” que llama a `GET /api/oauth/meta/start?companyId=...`
2) Redirige a Meta con `state` (incluye companyId). Tras consentimiento, Meta redirige a `/api/oauth/meta/callback?code=...&state=...`.
3) El callback intercambia el token a largo plazo y lo almacena en `SocialAccount` de la empresa. En la primera verificación, el adaptador resuelve y cachea `pageId` e `instagramBusinessId` automáticamente.

Adapter real:
- Archivo: `src/lib/meta/MetaAdapter.ts`.
- Capacidades iniciales:
	- Resolver Page/IG Business Account de la empresa vía `/me/accounts` y cachear en BD.
	- Resolver `mediaId` a partir del `permalink` del sorteo listando `/IG_USER_ID/media` y comparando por `permalink`.
	- Verificar comentarios: comprueba si el usuario participante (que debe tener `SocialAccount` de Instagram vinculado con `providerUserId`) comentó en el post. Devuelve además el número de menciones detectadas en su comentario.
	- Verificar likes (Instagram): no soportado por la API (no expone el listado de likes). Devuelve `false` por diseño. Para Facebook Page posts se añadirá en una iteración posterior.

Conmutación mock/real:
- `MOCK_VERIFICATION=pass|fail` → usa mock.
- Sin `MOCK_VERIFICATION` → `SocialVerifier` usa `MetaAdapter` real para Instagram.

Limitaciones conocidas:
- Instagram Graph API no expone el listado de “likers”; requisito `like` no puede auditarse de forma individual (sólo conteo agregado disponible).
- Para verificar comentarios por usuario es necesario que el participante conecte su cuenta de Instagram (guardar `providerUserId` en `SocialAccount` del `User`). Si no existe, la verificación de `comment/mentions` fallará.

Prueba manual rápida:
1. Conecta una empresa a Meta desde onboarding.
2. Crea un sorteo en Instagram con URL de post propio (del IG Business vinculado).
3. Asegúrate de que el participante tenga enlazada su cuenta de Instagram (aún por UI; se puede insertar el `SocialAccount` manualmente en BD para pruebas).
4. Ejecuta `POST /api/participations/:id/verify` y revisa el resultado de `comment/mentions`.

## 16. Contribución
PRs bienvenidos. Antes de abrir uno:
1. Crear rama feature.
2. Ejecutar `npm run lint` y `npm run typecheck`.
3. Añadir tests si modificas lógica de negocio (cuando framework de tests esté añadido).
4. Describir claramente cambios y motivación.

Licencia: Pendiente de definir (probablemente MIT o Propietaria en fase inicial).

---

© 2025 sortea.io

## Ciclo de Vida del Ganador

Estados del sorteo y selección:

1) draft
- El sorteo aún no es visible ni seleccionable.

2) active
- El sorteo está abierto a participaciones hasta `endsAt`.
- El endpoint `POST /api/giveaways/:id/select-winner` sólo se puede ejecutar si `endsAt < now` y el sorteo sigue en `active`.

3) awaiting_winner
- Tras ejecutar la selección: se crea un registro en `WinnerSelection` con un ganador primario y hasta 3 backups en `WinnerBackup`.
- Este estado permite la verificación/auditoría manual del ganador (cumplimiento de requisitos, elegibilidad legal, etc.).
- Si el ganador no cumple, se puede promover un backup manualmente en un flujo posterior (por definir).

4) finished
- El proceso de adjudicación concluye (ganador validado o suplente promovido). El sorteo queda congelado para historial/auditoría.

Notas de implementación:
- Selección aleatoria: usa `crypto.randomInt` para extraer un ganador primario y backups sin sesgo.
- Idempotencia: si ya existe selección previa, el endpoint devuelve error (409/400 según conflicto).
- Auditoría: conservar `executedAt`, `primaryParticipationId` y el orden de backups para trazabilidad.

## Verificación de Requisitos de RRSS (Adapter real IG + Mock)

Endpoint: `POST /api/participations/:id/verify`

- Autenticación requerida. Sólo el dueño de la participación puede verificar.
- Implementación: modo mock configurable con `MOCK_VERIFICATION` o adapter real para Instagram:
	- `pass` → todas las comprobaciones pasan.
	- `fail` → todas fallan.
-	- undefined → usa `MetaAdapter` real para Instagram (comentarios/mentions). Likes en IG no auditables por API.
- Requisitos soportados en el modelo: `follow`, `like`, `comment`, `mentions`.
- Respeta `Requirement.required`: sólo los requisitos obligatorios bloquean la aprobación.
- Idempotencia: si la participación ya está `approved` o `rejected`, devuelve el estado actual sin modificar.

Respuesta ejemplo:
```
{
	"status": "approved" | "rejected",
	"checked": [
		{ "type": "follow", "ok": true },
		{ "type": "mentions", "ok": false, "reason": "Needs 2 mentions" }
	]
}
```

Arquitectura:
- Servicio `SocialVerifier` (`src/lib/verification/SocialVerifier.ts`) con adaptadores por red.
- Adaptador real IG: `src/lib/meta/MetaAdapter.ts`
- Vinculación del participante: `/api/oauth/instagram/start` y `/api/oauth/instagram/callback` guardan `providerUserId` en `SocialAccount` del usuario.

## 17. Despliegue en Vercel

Esta sección describe cómo llevar el proyecto a producción usando Vercel (plataforma recomendada para Next.js). Incluye preparación de variables de entorno, migración de SQLite a Postgres y ajustes de build.

### 17.1 Checklist Rápido
1. Crear proyecto en Vercel conectado al repo.
2. Provisionar base de datos Postgres (Neon, Supabase, Railway, PlanetScale MySQL opcional) y obtener cadena de conexión.
3. Definir variables de entorno en Vercel (Production y Preview).
4. Ajustar `DATABASE_URL` para Postgres y ejecutar migraciones (migrate deploy).
5. Verificar `AUTH_SECRET`, `NEXTAUTH_URL` y credenciales OAuth reales (Google / Meta / Instagram).
6. Hacer un deploy; validar páginas clave y endpoints API.
7. Activar observabilidad (Vercel Analytics opcional) y monitoreo de errores.

### 17.2 Variables de Entorno de Producción
En Vercel → Project Settings → Environment Variables (añadir en Production y Preview):

```
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=prefer"
AUTH_SECRET="<cadena segura de 32+ bytes>"        # openssl rand -base64 32
NEXTAUTH_URL="https://tu-dominio.vercel.app"      # URL pública final

# Google OAuth (Production credentials)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Meta (Company OAuth)
META_APP_ID="..."
META_APP_SECRET="..."
META_REDIRECT_URI="https://tu-dominio.vercel.app/api/oauth/meta/callback"  # opcional si difiere

# Instagram (Basic Display para participantes)
INSTAGRAM_APP_ID="..."
INSTAGRAM_APP_SECRET="..."
INSTAGRAM_REDIRECT_URI="https://tu-dominio.vercel.app/api/oauth/instagram/callback"

# Verificación (opcional para forzar mock en staging)
MOCK_VERIFICATION="pass"  # quitar en producción para usar MetaAdapter real
```

Notas:
- Genera un nuevo `AUTH_SECRET` para producción (no reutilizar el de dev).
- `NEXTAUTH_URL` es requerido por NextAuth para construir URLs absolutas en callbacks.
- Mantén separados los valores de Preview (puedes usar una DB de staging).

### 17.3 Migración de SQLite a Postgres
Actualmente dev usa SQLite; para producción se recomienda Postgres:
1. Crea DB en Neon / Supabase / Railway.
2. Copia la cadena de conexión y colócala en `DATABASE_URL` (asegura parámetros SSL si el proveedor lo exige).
3. Ejecuta migraciones: Vercel no ejecuta `prisma migrate dev`; necesitas `migrate deploy`.

Opciones:
- Ajustar script de build en `package.json`:
	- De: `"build": "next build"`
	- A: `"build": "prisma migrate deploy && next build"`
- O usar un Command en Vercel: Build Command: `npm run build`.

Primera vez:
```bash
npx prisma migrate deploy
npx prisma generate
```

Si tu DB ya tiene el estado final y sólo necesitas el cliente: basta con `prisma generate`.

### 17.4 Consideraciones de Prisma
- El archivo `prisma.config.ts` ya centraliza configuración; no uses el campo obsoleto `prisma` en `package.json`.
- Para alto tráfico, evalúa Prisma Accelerate o Data Proxy; inicialmente no requerido.
- Usa migraciones formales (`prisma migrate dev`) en desarrollo antes de hacer deploy para evitar drift.

### 17.5 OAuth en Producción
- Registra URLs de redirect exactas en Google Cloud Console, Meta Developers y Instagram App.
- Cambios comunes: usar dominio final en lugar de `localhost:3000`.
- Revisa scopes concedidos y limita a mínimos (Instagram Basic Display: `user_profile`).

### 17.6 Seguridad y Buenas Prácticas
- Rotar tokens/secretos si hay sospecha de filtración.
- Limitar MOCK_VERIFICATION al entorno de pruebas.
- Configurar reglas de acceso en la DB (si proveedor lo permite) y habilitar logs para auditoría.
- Activar Vercel Environment Protection para previews críticos.

### 17.7 Verificación Post-Deploy
Checklist rápido tras el primer deploy:
1. `/` carga sin errores.
2. Login Google funciona y session se establece.
3. Crear empresa (POST /api/companies) y ver dashboard.
4. Crear sorteo y verificar estado inicial.
5. Vincular Instagram (flujo OAuth) y ver handle en `/perfil/vincular-social`.
6. Ejecutar `POST /api/participations/:id/verify` en un caso de prueba.
7. Selección de ganador (`POST /api/giveaways/:id/select-winner`) tras simular `endsAt`.

### 17.8 Observabilidad / Monitoring
- Errores: integrar Sentry (añadir DSN en env) en futuro.
- Logs: Vercel muestra logs de funciones; inspeccionar endpoints críticos tras deploy.
- Métricas: agregar dashboard interno (próximo roadmap) o usar Vercel Analytics.

### 17.9 Estrategia de Staging
Recomendado crear un entorno `Preview/Staging` con:
- `DATABASE_URL` apuntando a DB distinta.
- `MOCK_VERIFICATION=pass` para no golpear APIs reales.
- Tests manuales de UI antes de promover a producción.

### 17.10 Rollback
Si una migración falla:
1. Pausar deploy.
2. Restaurar snapshot en proveedor (Neon/Supabase ofrecen backups).
3. Revertir commit de migración y redeploy.

---
