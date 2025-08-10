/*
  # Crear tabla de pantallas

  1. Nueva Tabla
    - `screens`
      - `id` (uuid, primary key) - ID único de la pantalla
      - `name` (text) - Nombre de la pantalla
      - `location` (text) - Ubicación física de la pantalla
      - `resolution` (text) - Resolución de la pantalla
      - `status` (enum) - Estado de la pantalla (online, offline, maintenance)
      - `last_seen` (timestamp) - Última vez que se conectó
      - `created_at` (timestamp) - Fecha de creación
      - `updated_at` (timestamp) - Fecha de última actualización

  2. Seguridad
    - Habilitar RLS en la tabla `screens`
    - Política para que usuarios autenticados puedan leer todas las pantallas
    - Política para que solo admins y editores puedan crear/actualizar pantallas
*/

-- Crear tipo enum para estado de pantallas
CREATE TYPE screen_status AS ENUM ('online', 'offline', 'maintenance');

-- Crear tabla de pantallas
CREATE TABLE IF NOT EXISTS screens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text NOT NULL,
  resolution text NOT NULL DEFAULT '1920x1080',
  status screen_status DEFAULT 'offline',
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE screens ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Authenticated users can read screens"
  ON screens
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and editors can insert screens"
  ON screens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins and editors can update screens"
  ON screens
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins can delete screens"
  ON screens
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Trigger para actualizar updated_at
CREATE TRIGGER update_screens_updated_at
  BEFORE UPDATE ON screens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();