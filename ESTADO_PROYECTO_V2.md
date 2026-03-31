# Estado del Proyecto v2 — Chispoa

Agente IA para restaurantes que gestiona reservas por WhatsApp usando Claude, Twilio y Supabase.

| | |
|---|---|
| **URL producción** | `https://chispoa-ia.vercel.app` |
| **Dominio objetivo** | `chispoa.com` (pendiente — ver sección Pendientes) |
| **Última actualización** | 2026-03-31 |

---

## 1. Stack técnico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router, TypeScript) | 14.x |
| Auth + BD | Supabase (PostgreSQL + RLS) | @supabase/supabase-js 2.98 |
| IA | Anthropic Claude | @anthropic-ai/sdk 0.78 |
| WhatsApp | Twilio API | twilio 5.12 |
| CSS | Tailwind CSS + Radix UI | Tailwind 3.x |
| Validación | Zod | v4 (usa `.issues`, no `.errors`) |
| Hosting | Vercel | — |
| PWA | manifest.json + meta tags | Sin service worker |

**Nota crítica sobre Supabase**: el cliente NO usa el tipo genérico `<Database>` por incompatibilidad con `@supabase/supabase-js` v2.98. Se usa `as NombreTipo` en cada query y `as Record<string, unknown>` en inserts/updates con tipos incompatibles.

---

## 2. Variables de entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://qzvurqhiyxrdjbfsmyut.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # bypass RLS — solo en servidor

# Anthropic
ANTHROPIC_API_KEY=<api key>
ANTHROPIC_MODEL=claude-sonnet-4-20250514       # configurable sin redespliegue

# Twilio
TWILIO_ACCOUNT_SID=<account sid>
TWILIO_AUTH_TOKEN=<auth token>                 # también usado para validar firma del webhook
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886   # sandbox Twilio

# Cron
CRON_SECRET=solera-cron-secret-2024            # protege GET /api/cron/send-messages

# (Node automático)
NODE_ENV=production                            # Vercel lo inyecta automáticamente
```

---

## 3. Servicios externos

### Twilio WhatsApp
- **Tipo**: Sandbox (no aprobado por Meta aún)
- **Número**: `whatsapp:+14155238886`
- **Webhook configurado en Twilio**: `https://chispoa-ia.vercel.app/api/whatsapp/webhook` (POST)
- **Validación**: Firma HMAC verificada con `validateRequest()` del SDK de Twilio en cada petición entrante
- **Uso**: Recibir mensajes de clientes + enviar respuestas/notificaciones al dueño

### Supabase
- **Proyecto**: `qzvurqhiyxrdjbfsmyut.supabase.co`
- **Auth**: email/contraseña + Google OAuth
- **OAuth callback**: `https://chispoa-ia.vercel.app/auth/callback`
- **RLS**: activo en todas las tablas
- **Service role**: usado en webhook (`app/api/whatsapp/webhook`) y cron (`app/api/cron/send-messages`)

### Anthropic / Claude
- **Modelo actual**: `claude-sonnet-4-20250514` (configurable vía `ANTHROPIC_MODEL`)
- **Uso**: Procesamiento de mensajes WhatsApp — extracción de intenciones, generación de respuestas
- **Historial**: últimos 10 mensajes pasados como contexto (almacena 20)

### Vercel
- **Dominio**: `chispoa-ia.vercel.app`
- **Cron nativo** (`vercel.json`): `GET /api/cron/send-messages` a las **10:00 UTC** diariamente
- **Remotos git**: `origin` → `restaurante-agente-whatsapp`, `vercel` → `restaurante-agente-whatsapp-v2`

### cron-job.org (externo)
- Llama manualmente a `GET https://chispoa-ia.vercel.app/api/cron/send-messages`
- Header: `Authorization: Bearer solera-cron-secret-2024`
- Funciona como trigger externo independiente del cron de Vercel
- Verificado: devuelve `{"sent":19,"failed":0}` en pruebas recientes

### Google Fonts
- Unbounded (400/700/900) — headings
- Plus Jakarta Sans (300/400/500/600) — body

---

## 4. Base de datos

### `restaurants`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | PK |
| owner_id | UUID | FK → auth.users |
| name | TEXT | |
| description | TEXT | nullable |
| address | TEXT | nullable |
| owner_phone | TEXT | Para notificaciones al dueño |
| whatsapp_number | TEXT | Número Twilio asignado (ej: `whatsapp:+14155238886`) |
| google_maps_url | TEXT | Link para solicitar reseñas post-visita |
| created_at | TIMESTAMPTZ | |

### `menu_items`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | PK |
| restaurant_id | UUID | FK |
| name | TEXT | |
| description | TEXT | nullable |
| price | DECIMAL(10,2) | |
| category | TEXT | Ej: Entrantes, Principales |
| is_available | BOOLEAN | |
| allergens | TEXT[] | Array de alérgenos (nullable) |
| created_at | TIMESTAMPTZ | |

### `restaurant_hours`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | PK |
| restaurant_id | UUID | FK |
| day_of_week | INTEGER | 0=Domingo … 6=Sábado |
| open_time | TIME | Turno 1 apertura (nullable) |
| close_time | TIME | Turno 1 cierre (nullable) |
| open_time_2 | TIME | Turno 2 apertura — cenas (nullable) |
| close_time_2 | TIME | Turno 2 cierre (nullable) |
| is_closed | BOOLEAN | |
| UNIQUE | | `(restaurant_id, day_of_week)` |

### `reservations`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | PK |
| restaurant_id | UUID | FK |
| customer_name | TEXT | |
| customer_phone | TEXT | |
| reservation_date | DATE | YYYY-MM-DD |
| reservation_time | TIME | HH:MM |
| party_size | INTEGER | |
| notes | TEXT | nullable |
| status | TEXT | `pending` \| `confirmed` \| `cancelled` |
| created_at | TIMESTAMPTZ | |

### `conversations`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | PK |
| restaurant_id | UUID | FK |
| customer_phone | TEXT | |
| messages | JSONB | Array de `{role, content, timestamp}` — máx. 20 mensajes |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | Auto-actualizado por trigger |
| UNIQUE | | `(restaurant_id, customer_phone)` |

### `scheduled_messages`
| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | PK |
| restaurant_id | UUID | FK |
| customer_phone | TEXT | |
| message | TEXT | |
| twilio_number | TEXT | Número desde el que enviar |
| send_at | TIMESTAMPTZ | Cuándo enviar |
| sent | BOOLEAN | Si ya fue procesado (enviado o descartado) |
| retry_count | INTEGER | DEFAULT 0 — descarta al llegar a 3 |
| sent_at | TIMESTAMPTZ | Cuándo se envió realmente (nullable) |
| created_at | TIMESTAMPTZ | |
| INDEX | | `(send_at) WHERE sent=false` |

**SQL ejecutado en Supabase:**
```sql
ALTER TABLE scheduled_messages ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
```

---

## 5. Funcionalidades implementadas

### Agente WhatsApp (`POST /api/whatsapp/webhook`)
- Valida firma HMAC de Twilio (rechaza 403 si inválida)
- Trunca input del cliente a 2000 caracteres
- Identifica restaurante por número Twilio destino
- Carga menú (solo disponibles), horarios e historial (últimos 20 mensajes)
- Llama a Claude con system prompt multiidioma (español/catalán/inglés/etc.)
- Detecta intenciones mediante tokens especiales:
  - `[CREAR_RESERVA: nombre="X" fecha="YYYY-MM-DD" hora="HH:MM" personas=N notas=""]`
  - `[CANCELAR_RESERVA: nombre="X" fecha="YYYY-MM-DD" hora="HH:MM"]`
  - `[NOTIFICAR_DUENO: <motivo>]`
- Al crear reserva:
  - Valida fecha no pasada + restaurante abierto en ese horario
  - Inserta en `reservations` con `status: 'pending'`
  - Notifica al dueño por WhatsApp con link al dashboard
- Al cancelar reserva:
  - Cancela en BD
  - Elimina `scheduled_messages` pendientes del cliente
  - Notifica al dueño
- Guarda historial de conversación (máx. 20 mensajes, upsert anti-race condition)

### Dashboard — Reservas (`/dashboard/reservations`)
- Tabla paginada: carga 50 reservas, botón "Cargar más" si hay más
- Filtros por estado: Todas / Pendientes / Confirmadas
- Al **confirmar** reserva:
  - Cancela automáticamente reservas duplicadas del mismo cliente en la misma fecha
  - Crea `scheduled_message` con anti-duplicado (verifica que no existe uno pendiente)
  - Timing del mensaje: reserva antes 17:00 → envío +3h; después 17:00 → envío +14h
  - Envía WhatsApp de confirmación al cliente
- Al **cancelar** reserva:
  - Envía WhatsApp de cancelación al cliente
- Crear reserva manual desde dialog
- Guarda notificaciones en historial de conversación

### Dashboard — Menú (`/dashboard/menu`)
- CRUD de platos: crear, editar, eliminar
- Toggle de disponibilidad por plato
- Gestión de alérgenos (array de strings)
- Agrupación por categoría

### Dashboard — Horarios (`/dashboard/hours`)
- 7 días con doble turno (almuerzo + cena)
- Checkbox "Cerrado" por día
- Upsert por `(restaurant_id, day_of_week)`

### Dashboard — Configuración (`/dashboard/settings`)
- Nombre, descripción, dirección, teléfono dueño, número WhatsApp, Google Maps URL
- Validación con Zod

### Dashboard — Home (`/dashboard`)
- Reservas de hoy divididas en mediodía (< 16:00) y noche (≥ 16:00)
- Confirmación/cancelación directa con notificación WhatsApp

### Cron de reseñas (`GET /api/cron/send-messages`)
- Protegido con `Authorization: Bearer {CRON_SECRET}`
- Busca mensajes con `sent=false` y `send_at <= now()`
- Si `retry_count >= 3` → marca `sent=true` y descarta (no reenvía)
- En cada fallo → incrementa `retry_count`
- Al enviar → marca `sent=true` y guarda `sent_at`

### Health check (`GET /api/health`)
- Verifica conectividad con Supabase (`SELECT id FROM restaurants LIMIT 1`)
- Responde `{"status":"ok","timestamp":"..."}` o `{"status":"error"}` 500

### Autenticación
- Login: email/contraseña + Google OAuth
- Registro, recuperación y cambio de contraseña
- Middleware protege todas las rutas `/dashboard/*`

### Páginas públicas
- `/` — Landing page (hero, features, testimonios, pricing 150€/mes)
- `/privacidad`, `/terminos` — Páginas legales requeridas por Meta

---

## 6. Seguridad implementada

| Medida | Dónde | Detalle |
|--------|-------|---------|
| Validación firma Twilio | `webhook/route.ts` | `validateRequest()` — 403 si inválida |
| Truncado de input | `webhook/route.ts` | `.slice(0, 2000)` antes de pasar a Claude |
| X-Frame-Options: DENY | `next.config.js` | Previene clickjacking |
| X-Content-Type-Options: nosniff | `next.config.js` | Previene MIME sniffing |
| Referrer-Policy | `next.config.js` | `strict-origin-when-cross-origin` |
| RLS en Supabase | Todas las tablas | Usuarios solo ven sus propios datos |
| Service role aislado | Webhook + cron | Solo en rutas de servidor, nunca expuesto al cliente |
| CRON_SECRET | `/api/cron/*` | Bearer token en header Authorization |
| Ownership check | `loadMoreReservations` | Verifica que el restaurante pertenece al usuario antes de paginar |
| Middleware de auth | `middleware.ts` | Redirige `/dashboard/*` → login si no autenticado |

**Pendiente de auditoría:**
- Sin rate limiting en el webhook (cualquier IP puede enviar, aunque la firma lo valida)
- `allowedOrigins` en `next.config.js` no incluye `chispoa.com` aún

---

## 7. PWA

| Archivo | Descripción |
|---------|-------------|
| `public/manifest.json` | `start_url: /dashboard`, `display: standalone`, color `#FF5C1A` |
| `public/icon-192.png` | Icono PWA 192×192 |
| `public/icon-512.png` | Icono PWA 512×512 |
| `public/chispoa_whatsapp_640x640.png` | Imagen para perfil de WhatsApp Business |
| `app/layout.tsx` | Meta tags: `apple-mobile-web-app-capable`, `theme-color`, `apple-touch-icon` |

**No configurado:**
- Service worker (sin caché offline, sin push notifications nativas)

---

## 8. Archivos clave

```
app/
  api/
    whatsapp/webhook/route.ts   ← Webhook Twilio (núcleo del agente)
    cron/send-messages/route.ts ← Envío de mensajes programados post-visita
    health/route.ts             ← Health check con ping a Supabase
    auth/callback/route.ts      ← OAuth callback Supabase
  (auth)/
    login/page.tsx              ← Login email + Google OAuth
    register/page.tsx
    forgot-password/page.tsx
    reset-password/page.tsx
    privacidad/page.tsx         ← Requerida por Meta/WhatsApp Business
    terminos/page.tsx
  (dashboard)/
    layout.tsx                  ← Stats globales (sidebar)
    dashboard/
      page.tsx                  ← Reservas de hoy por turno
      settings/page.tsx + actions.ts    ← Config restaurante
      menu/page.tsx + actions.ts        ← CRUD menú + alérgenos
      reservations/page.tsx + actions.ts ← Reservas + paginación + loadMore
      hours/page.tsx + actions.ts       ← Horarios doble turno
  page.tsx                      ← Landing page pública
  layout.tsx                    ← Root layout + PWA meta tags + fuentes

lib/
  agent.ts                      ← Claude: system prompt + extracción de intenciones
  twilio.ts                     ← sendWhatsAppMessage()
  supabase/client.ts            ← Cliente browser
  supabase/server.ts            ← Cliente SSR
  supabase/types.ts             ← Tipos manuales (Restaurant, Reservation, etc.)

components/
  dashboard/reservation-card.tsx
  reservations/reservations-client.tsx  ← Estado local + paginación cliente
  reservations/new-reservation-dialog.tsx
  menu/menu-client.tsx, menu-form.tsx, menu-toggle.tsx
  hours/hours-form.tsx
  settings/settings-form.tsx

supabase/migrations/
  001_initial_schema.sql        ← Tablas base + RLS
  002_menu_items_allergens.sql  ← Columna allergens[]
  003_scheduled_messages.sql    ← Tabla scheduled_messages

middleware.ts                   ← Protección /dashboard/*
next.config.js                  ← Server Actions + security headers
vercel.json                     ← Cron Vercel (10:00 UTC diario)
```

---

## 9. Deuda técnica (informe de auditoría)

### Alta prioridad
- **URL del webhook hardcodeada** en `webhook/route.ts` (línea 36): `'https://chispoa-ia.vercel.app/api/whatsapp/webhook'`. Debe moverse a una variable de entorno `NEXT_PUBLIC_APP_URL` antes de cambiar de dominio.
- **`allowedOrigins` desactualizado** en `next.config.js`: solo incluye `chispoa-ia.vercel.app`. Añadir `chispoa.com` al migrar.
- **Sin rate limiting** en el webhook. La validación de firma Twilio mitiga el riesgo, pero un número de Twilio comprometido podría abusar del endpoint.

### Media prioridad
- **Query duplicada de restaurante**: las páginas `settings`, `menu`, `reservations` y `hours` hacen una query individual a `restaurants` que ya se obtiene en `app/(dashboard)/layout.tsx`. (4 TODOs en el código)
- **Conversaciones sin expiración**: crecen indefinidamente. Añadir política de retención o limitar por antigüedad.
- **Sin paginación en conversaciones**: el historial completo se carga aunque solo se usan los últimos 20 mensajes.
- **Sin service worker**: la PWA no funciona offline y no puede enviar push notifications nativas.

### Baja prioridad
- **`sent_at` no está en el tipo `ScheduledMessage`** (`lib/supabase/types.ts`). El cron lo escribe pero TypeScript no lo conoce.
- **Validación incompleta de `party_size`**: el agente puede crear una reserva con `partySize: 0` o valores negativos si Claude extrae mal el número.

---

## 10. Pendientes para el 1 de abril (lanzamiento chispoa.com)

### Infraestructura
- [ ] Apuntar dominio `chispoa.com` a Vercel
- [ ] Añadir `chispoa.com` a `allowedOrigins` en `next.config.js`
- [ ] Actualizar OAuth callback en Supabase: añadir `https://chispoa.com/auth/callback`
- [ ] Actualizar URL del webhook en la consola de Twilio: `https://chispoa.com/api/whatsapp/webhook`
- [ ] Mover la URL hardcodeada del webhook a `NEXT_PUBLIC_APP_URL` en `webhook/route.ts` y `actions.ts` (notificación al dueño con link al dashboard)

### WhatsApp Business
- [ ] Solicitar número de WhatsApp Business aprobado por Meta (salir del Sandbox de Twilio)
- [ ] Actualizar `TWILIO_WHATSAPP_NUMBER` con el número aprobado
- [ ] Actualizar `restaurant.whatsapp_number` en la BD para el restaurante piloto

### Opcional antes del lanzamiento
- [ ] Añadir `NEXT_PUBLIC_APP_URL` como variable de entorno en Vercel
- [ ] Implementar service worker básico para PWA offline
- [ ] Añadir `sent_at` al tipo `ScheduledMessage` en types.ts

---

## Cómo arrancar localmente

```bash
npm install
cp .env.local.example .env.local   # rellenar con credenciales reales
npm run dev

# Para webhook local:
ngrok http 3000
# Configurar en Twilio: https://<id>.ngrok.io/api/whatsapp/webhook

# Para probar el cron manualmente:
curl -H "Authorization: Bearer solera-cron-secret-2024" http://localhost:3000/api/cron/send-messages

# Health check:
curl http://localhost:3000/api/health
```
