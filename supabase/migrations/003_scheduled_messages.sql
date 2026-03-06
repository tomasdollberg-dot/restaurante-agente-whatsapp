-- Mensajes programados para envío diferido
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  message     TEXT NOT NULL,
  twilio_number TEXT NOT NULL,
  send_at     TIMESTAMPTZ NOT NULL,
  sent        BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_messages_pending
  ON scheduled_messages (send_at)
  WHERE sent = false;
