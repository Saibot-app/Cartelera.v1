/*
  # Crear tabla de contenido

  1. Nueva Tabla
    - `content`
      - `id` (uuid, primary key) - ID único del contenido
      - `title` (text) - Título del contenido
      - `type` (enum) - Tipo de contenido (text, image, video, html)
      - `content_data` (jsonb) - Datos del contenido (texto, URL, HTML, etc.)
      - `duration` (integer) - Duración en segundos
      - `is_active` (boolean) - Si el contenido está activo
      - `created_by` (uuid) - ID del usuario que creó el contenido
      - `created_at` (timestamp) - Fecha de creación
      - `updated_at` (timestamp) - Fecha de última actualización

  2. Seguridad
    - Habilitar RLS en la tabla `content`
    - Política para que usuarios autenticados puedan leer contenido activo
    - Política para que admins y editores puedan crear/actualizar contenido
    - Política para que usuarios puedan ver su propio contenido
*/

-- Crear tipo enum para tipos de contenido
CREATE TYPE content_type AS ENUM ('text', 'image', 'video', 'html');

-- Crear tabla de contenido
CREATE TABLE IF NOT EXISTS content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type content_type NOT NULL,
  content_data jsonb NOT NULL,
  duration integer NOT NULL DEFAULT 5,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Authenticated users can read active content"
  ON content
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can read own content"
  ON content
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins and editors can insert content"
  ON content
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Users can update own content"
  ON content
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can update any content"
  ON content
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Users can delete own content"
  ON content
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can delete any content"
  ON content
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
CREATE TRIGGER update_content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();