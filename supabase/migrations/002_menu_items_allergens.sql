-- Añade columna de alérgenos (array de texto) a menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}';
