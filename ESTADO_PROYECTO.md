# Estado del Proyecto — Chispoa

Agente IA para restaurantes que gestiona reservas por WhatsApp usando Claude, Twilio y Supabase.
URL de producción: `https://chispoa-ia.vercel.app`

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Auth + BD | Supabase (PostgreSQL + RLS) |
| IA | Anthropic Claude (`claude-sonnet-4-6`) |
| WhatsApp | Twilio API |
| CSS | Tailwind CSS v3 + Radix UI |
| Validación | Zod v4 (usa `.issues`, no `.errors`) |
| Hosting | Vercel |

**Nota sobre Supabase**: el cliente NO usa el tipo genérico `<Database>` por incompatibilidad con `@supabase/supabase-js` v2.98. Se usa `as NombreTipo` en cada query.

---

## Variables de entorno

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # usado en webhook y cron (bypass RLS)

# Anthropic
ANTHROPIC_API_KEY=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=           # formato: whatsapp:+14155238886

# Cron (protege el endpoint /api/cron/send-messages en producción)
CRON_SECRET=solera-cron-secret-2024
```

---

## Servicios externos

### Twilio
- Número Sandbox: `whatsapp:+14155238886`
- Webhook configurado en: `https://chispoa-ia.vercel.app/api/whatsapp/webhook`
- Usado para recibir mensajes entrantes y enviar respuestas/notificaciones
- El restaurante tiene su número asignado en `restaurants.whatsapp_number`

### Supabase
- Proyecto: `qzvurqhiyxrdjbfsmyut.supabase.co`
- Auth habilitado: email/contraseña + Google OAuth
- OAuth callback: `https://chispoa-ia.vercel.app/auth/callback`
- RLS activo en todas las tablas (usuarios solo ven sus propios datos)
- `service_role` tiene acceso total (webhooks, cron)

### Anthropic / Claude
- Modelo: `claude-sonnet-4-6`
- Procesa mensajes WhatsApp entrantes y extrae intenciones
- System prompt en `lib/agent.ts`: responde en el idioma del cliente, máx. 2-3 líneas, sin emojis decorativos

### Vercel
- Cron job configurado en `vercel.json`: `GET /api/cron/send-messages` a las 10:00 UTC diario
- Dominio: `chispoa-ia.vercel.app`

---

## Base de datos (5 tablas)

### `restaurants`
Datos del restaurante y su dueño.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | PK |
| owner_id | UUID | FK → auth.users |
| name | TEXT | Nombre |
| description | TEXT | |
| address | TEXT | |
| owner_phone | TEXT | Para notificaciones al dueño |
| whatsapp_number | TEXT | Número Twilio asignado |
| google_maps_url | TEXT | Link para solicitar reseñas |
| created_at | TIMESTAMPTZ | |

### `menu_items`
Platos del menú con soporte para alérgenos.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | PK |
| restaurant_id | UUID | FK |
| name | TEXT | |
| description | TEXT | |
| price | DECIMAL(10,2) | |
| category | TEXT | Ej: Entrantes, Principales |
| is_available | BOOLEAN | |
| allergens | TEXT[] | Array de alérgenos |

### `restaurant_hours`
Horarios con soporte para doble turno (almuerzo + cena).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| restaurant_id | UUID | FK |
| day_of_week | INTEGER | 0=Domingo … 6=Sábado |
| open_time | TIME | Turno 1 apertura |
| close_time | TIME | Turno 1 cierre |
| open_time_2 | TIME | Turno 2 apertura (opcional) |
| close_time_2 | TIME | Turno 2 cierre (opcional) |
| is_closed | BOOLEAN | |
| UNIQUE | | (restaurant_id, day_of_week) |

### `reservations`
Reservas creadas por el agente o manualmente.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | PK |
| restaurant_id | UUID | FK |
| customer_name | TEXT | |
| customer_phone | TEXT | |
| reservation_date | DATE | YYYY-MM-DD |
| reservation_time | TIME | HH:MM |
| party_size | INTEGER | |
| notes | TEXT | |
| status | TEXT | `pending` \| `confirmed` \| `cancelled` |

### `conversations`
Historial de conversación por cliente (últimos 20 mensajes).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| restaurant_id | UUID | FK |
| customer_phone | TEXT | |
| messages | JSONB | Array de `{role, content, timestamp}` |
| UNIQUE | | (restaurant_id, customer_phone) |

### `scheduled_messages`
Mensajes programados para enviar post-visita (reseñas).

| Columna | Tipo | Descripción |
|---------|------|-------------|
| id | UUID | PK |
| restaurant_id | UUID | FK |
| customer_phone | TEXT | |
| message | TEXT | Contenido del mensaje |
| twilio_number | TEXT | Número desde el que enviar |
| send_at | TIMESTAMPTZ | Cuándo enviar |
| sent | BOOLEAN | Si ya fue enviado |
| INDEX | | (send_at) WHERE sent=false |

---

## Funcionalidades implementadas

### Agente WhatsApp (`/api/whatsapp/webhook`)
- Recibe mensajes de Twilio (POST `application/x-www-form-urlencoded`)
- Identifica el restaurante por número de destino
- Carga menú, horarios e historial de conversación
- Procesa con Claude y detecta intenciones mediante tokens especiales:
  - `[CREAR_RESERVA: nombre="X" fecha="YYYY-MM-DD" hora="HH:MM" personas=N notas=""]`
  - `[CANCELAR_RESERVA: nombre="X" fecha="YYYY-MM-DD" hora="HH:MM"]`
  - `[NOTIFICAR_DUENO: <motivo>]`
- Valida que la fecha no sea pasada y que el restaurante esté abierto
- Notifica al dueño por WhatsApp cuando llega una nueva solicitud
- Guarda historial (máx. 20 mensajes por conversación)

### Dashboard del restaurante
- **`/dashboard`** — Reservas de hoy divididas en mediodía (< 16:00) y noche (≥ 16:00)
- **`/dashboard/reservations`** — Tabla completa de reservas con acciones:
  - Confirmar: cancela duplicados del mismo cliente/fecha, programa mensaje de reseña, notifica al cliente por WhatsApp
  - Cancelar: elimina mensajes programados pendientes, notifica al cliente
  - Crear reserva manual desde un dialog
- **`/dashboard/menu`** — CRUD de platos con alérgenos y toggle de disponibilidad
- **`/dashboard/hours`** — Configuración de horarios con doble turno y días cerrados
- **`/dashboard/settings`** — Datos del restaurante (nombre, dirección, teléfono dueño, número WhatsApp, Google Maps)

### Mensajes automáticos de reseña (`/api/cron/send-messages`)
- Cron diario a las 10:00 UTC (Vercel Cron)
- Envía mensajes con `send_at <= now()` y `sent = false`
- Mensaje se crea SOLO al confirmar una reserva (no al crearla)
- Timing: reserva antes de 17:00 → mensaje +3h; después de 17:00 → +14h
- Protegido con `Authorization: Bearer {CRON_SECRET}`
- Anti-duplicados: verifica que no exista ya un mensaje pendiente para ese cliente+restaurante

### Autenticación
- Login con email/contraseña
- Login con Google OAuth
- Recuperación y cambio de contraseña
- Middleware protege todas las rutas `/dashboard/*`

### Páginas públicas
- **`/`** — Landing page con hero, features, testimonios y pricing (150€/mes)
- **`/privacidad`** y **`/terminos`** — Páginas legales requeridas por Meta/WhatsApp

---

## Archivos clave y su función

```
app/
  api/
    whatsapp/webhook/route.ts   ← Webhook Twilio: núcleo del agente
    cron/send-messages/route.ts ← Envío de mensajes programados
    auth/callback/route.ts      ← OAuth callback Supabase
  (auth)/
    login/page.tsx              ← Login con email + Google
    register/page.tsx           ← Registro de nuevos usuarios
    forgot-password/page.tsx    ← Reset password
    reset-password/page.tsx     ← Cambio de contraseña
    privacidad/page.tsx         ← Política de privacidad
    terminos/page.tsx           ← Términos de servicio
  (dashboard)/
    layout.tsx                  ← Layout con stats globales del sidebar
    dashboard/
      page.tsx                  ← Reservas de hoy (mediodía/noche)
      settings/
        page.tsx                ← Config del restaurante
        actions.ts              ← saveSettings()
      menu/
        page.tsx                ← Gestión del menú
        actions.ts              ← createMenuItem / updateMenuItem / deleteMenuItem / toggle
      reservations/
        page.tsx                ← Listado de reservas
        actions.ts              ← updateReservationStatus / createReservation
      hours/
        page.tsx                ← Config horarios
        actions.ts              ← saveHours()
  page.tsx                      ← Landing page pública

lib/
  agent.ts                      ← Lógica IA: Claude, system prompt, extracción de intenciones
  twilio.ts                     ← sendWhatsAppMessage()
  utils.ts                      ← cn() (merge Tailwind classes)
  supabase/
    client.ts                   ← Cliente Supabase (browser)
    server.ts                   ← Cliente Supabase (server / SSR)
    types.ts                    ← Tipos manuales + Database type

components/
  dashboard/
    dashboard-shell.tsx         ← Layout con sidebar + topbar
    sidebar.tsx                 ← Navegación
    top-bar.tsx                 ← Barra superior
    reservation-card.tsx        ← Tarjeta de reserva individual
  settings/settings-form.tsx
  menu/menu-client.tsx, menu-form.tsx, menu-toggle.tsx
  hours/hours-form.tsx
  reservations/reservations-client.tsx, new-reservation-dialog.tsx
  ui/                           ← Componentes base (button, card, dialog, input…)

supabase/migrations/
  001_initial_schema.sql        ← Tablas base + RLS
  002_menu_items_allergens.sql  ← Columna allergens[]
  003_scheduled_messages.sql    ← Tabla scheduled_messages

middleware.ts                   ← Protección de rutas /dashboard/*
next.config.js                  ← Config Next.js
vercel.json                     ← Cron job Vercel
```

---

## Pendientes conocidos

### TODOs en el código
- Las páginas de settings, menu, reservations y hours hacen una query individual a `restaurants` que ya se obtiene en `app/(dashboard)/layout.tsx`. Consolidar para evitar la llamada duplicada.

### Mejoras pendientes
- El número de WhatsApp de Twilio es el Sandbox (`+14155238886`). Para producción real se necesita un número aprobado por Meta/WhatsApp Business.
- No hay límite de rate en el webhook de Twilio (cualquier número puede enviar mensajes).
- No hay paginación en la tabla de reservas (cargará todas al crecer el volumen).
- Los mensajes de reseña no tienen mecanismo de reintento si Twilio falla (el cron los marca como `sent=true` solo si no hay error, pero si hay error en Twilio se pierden silenciosamente).
- Las conversaciones se guardan sin expiración (pueden crecer indefinidamente).

---

## Cómo arrancar localmente

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Rellenar con credenciales reales

# 3. Ejecutar migraciones SQL en el dashboard de Supabase
# supabase/migrations/001_initial_schema.sql
# supabase/migrations/002_menu_items_allergens.sql
# supabase/migrations/003_scheduled_messages.sql

# 4. Arrancar servidor de desarrollo
npm run dev

# 5. Exponer webhook para pruebas locales con Twilio
ngrok http 3000
# Configurar la URL de ngrok en Twilio Sandbox: https://<id>.ngrok.io/api/whatsapp/webhook
```
