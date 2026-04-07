-- Añade reservation_date a scheduled_messages para filtrar mensajes de confirmación caducados
ALTER TABLE scheduled_messages ADD COLUMN IF NOT EXISTS reservation_date DATE;
