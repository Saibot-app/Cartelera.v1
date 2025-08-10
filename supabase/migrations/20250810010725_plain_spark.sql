/*
  # Crear tabla de playlists

  1. Nueva Tabla
    - `playlists`
      - `id` (uuid, primary key) - ID único de la playlist
      - `name` (text) - Nombre de la playlist
      - `description` (text) - Descripción de la playlist
      - `is_active` (boolean) - Si la playlist está activa
      - `created_by` (uuid) - ID del usuario que creó la playlist
      - `created_at` (timestamp) - Fecha de creación
      - `updated_at` (timestamp) - Fecha de última actualización

  2. Seguridad
    - Habilitar RLS en la tabla `playlists`
    - Política para que usuarios autenticados puedan leer playlists activas
    - Política para que admins y editores puedan crear/actualizar playlists
*/

-- Crear tabla de playlists
CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Authenticated users can read active playlists"
  ON playlists
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can read own playlists"
  ON playlists
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins and editors can insert playlists"
  ON playlists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update own playlists"
  ON playlists
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can update any playlist"
  ON playlists
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete own playlists"
  ON playlists
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can delete any playlist"
  ON playlists
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
CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON playlists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();