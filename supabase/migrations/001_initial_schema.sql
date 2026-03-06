-- ============================================================
-- SCHEMA INICIAL: Agente WhatsApp para Restaurantes (SaaS)
-- ============================================================

-- Tabla de restaurantes (uno por dueño/cuenta)
CREATE TABLE IF NOT EXISTS restaurants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  address     TEXT,
  owner_phone TEXT NOT NULL,        -- Teléfono del dueño para notificaciones
  whatsapp_number TEXT,             -- Número Twilio asignado al restaurante
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de ítems del menú
CREATE TABLE IF NOT EXISTS menu_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  price         DECIMAL(10, 2) NOT NULL DEFAULT 0,
  category      TEXT NOT NULL DEFAULT 'General',
  is_available  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de horarios por día (0=Domingo, 1=Lunes, ..., 6=Sábado)
CREATE TABLE IF NOT EXISTS restaurant_hours (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  day_of_week   INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time     TIME,
  close_time    TIME,
  is_closed     BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(restaurant_id, day_of_week)
);

-- Tabla de reservas
CREATE TABLE IF NOT EXISTS reservations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id    UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_name    TEXT NOT NULL,
  customer_phone   TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  party_size       INTEGER NOT NULL DEFAULT 2,
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de conversaciones WhatsApp (historial para el agente IA)
CREATE TABLE IF NOT EXISTS conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  messages      JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, customer_phone)
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE restaurants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_hours  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations     ENABLE ROW LEVEL SECURITY;

-- Restaurants: sólo el dueño puede ver y modificar su restaurante
CREATE POLICY "Owner manages own restaurant"
  ON restaurants FOR ALL
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Helper: obtener el restaurant_id del usuario actual
CREATE OR REPLACE FUNCTION get_user_restaurant_id()
RETURNS UUID AS $$
  SELECT id FROM restaurants WHERE owner_id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Menu Items: a través del restaurante del usuario
CREATE POLICY "Owner manages own menu items"
  ON menu_items FOR ALL
  USING (restaurant_id = get_user_restaurant_id())
  WITH CHECK (restaurant_id = get_user_restaurant_id());

-- Restaurant Hours
CREATE POLICY "Owner manages own hours"
  ON restaurant_hours FOR ALL
  USING (restaurant_id = get_user_restaurant_id())
  WITH CHECK (restaurant_id = get_user_restaurant_id());

-- Reservations
CREATE POLICY "Owner manages own reservations"
  ON reservations FOR ALL
  USING (restaurant_id = get_user_restaurant_id())
  WITH CHECK (restaurant_id = get_user_restaurant_id());

-- Conversations
CREATE POLICY "Owner manages own conversations"
  ON conversations FOR ALL
  USING (restaurant_id = get_user_restaurant_id())
  WITH CHECK (restaurant_id = get_user_restaurant_id());

-- Permitir al service role hacer todo (para el webhook del agente)
CREATE POLICY "Service role full access restaurants"
  ON restaurants FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access menu_items"
  ON menu_items FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access hours"
  ON restaurant_hours FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access reservations"
  ON reservations FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access conversations"
  ON conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
