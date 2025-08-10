/*
  # Crear tabla de programaciones

  1. Nueva Tabla
    - `schedules`
      - `id` (uuid, primary key) - ID único de la programación
      - `name` (text) - Nombre de la programación
      - `playlist_id` (uuid) - ID de la playlist a reproducir
      - `screen_id` (uuid) - ID de la pantalla donde reproducir
      - `start_time` (time) - Hora de inicio
      - `end_time` (time) - Hora de fin
      - `days_of_week` (integer[]) - Días de la semana (0=domingo, 6=sábado)
      - `is_active` (boolean) - Si la programación está activa
      - `created_by` (uuid) - ID del usuario que creó la programación
      - `created_at` (timestamp) - Fecha de creación
      - `updated_at` (timestamp) - Fecha de última actualización

  2. Seguridad
    - Habilitar RLS en la tabla `schedules`
    - Política para que usuarios autenticados puedan leer programaciones activas
    - Política para que admins y editores puedan gestionar programaciones
*/

-- Crear tabla de programaciones
CREATE TABLE IF NOT EXISTS schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE,
  screen_id uuid REFERENCES screens(id) ON DELETE CASCADE,
  start_time time NOT NULL,
  end_time time NOT NULL,
  days_of_week integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  CONSTRAINT valid_days CHECK (
    array_length(days_of_week, 1) > 0 AND
    days_of_week <@ ARRAY[0,1,2,3,4,5,6]
  )
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_schedules_screen_id ON schedules(screen_id);
CREATE INDEX IF NOT EXISTS idx_schedules_playlist_id ON schedules(playlist_id);
CREATE INDEX IF NOT EXISTS idx_schedules_active ON schedules(is_active);

-- Habilitar RLS
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Authenticated users can read active schedules"
  ON schedules
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can read own schedules"
  ON schedules
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins and editors can insert schedules"
  ON schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update own schedules"
  ON schedules
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can update any schedule"
  ON schedules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete own schedules"
  ON schedules
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can delete any schedule"
  ON schedules
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
CREATE TRIGGER update_schedules_updated_at
  BEFORE UPDATE ON schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();