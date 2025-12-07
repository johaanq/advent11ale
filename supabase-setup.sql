-- Script SQL para crear las tablas en Supabase
-- Ejecuta este script en el SQL Editor de Supabase

-- Tabla para guardar regalos abiertos (estado global compartido)
CREATE TABLE IF NOT EXISTS opened_gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_id INTEGER NOT NULL UNIQUE, -- Solo puede haber un registro por regalo (1, 2, 3, 4)
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_opened_gifts_gift_id ON opened_gifts(gift_id);
CREATE INDEX IF NOT EXISTS idx_opened_gifts_opened_at ON opened_gifts(opened_at);

-- Habilitar Row Level Security (RLS)
ALTER TABLE opened_gifts ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública (cualquiera puede ver qué regalos están abiertos)
CREATE POLICY "Allow public read" ON opened_gifts
  FOR SELECT
  USING (true);

-- Política para permitir inserción pública (cualquiera puede abrir regalos)
-- NOTA: En producción, considera restringir esto usando API keys o autenticación
CREATE POLICY "Allow public insert" ON opened_gifts
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir actualización (upsert)
CREATE POLICY "Allow public update" ON opened_gifts
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON TABLE opened_gifts IS 'Estado global de regalos abiertos. Compartido entre todos los dispositivos.';
COMMENT ON COLUMN opened_gifts.gift_id IS 'ID del regalo (1, 2, 3, 4)';
COMMENT ON COLUMN opened_gifts.opened_at IS 'Fecha y hora exacta en que se abrió el regalo';

