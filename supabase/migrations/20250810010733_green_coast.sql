/*
  # Crear tabla de elementos de playlist

  1. Nueva Tabla
    - `playlist_items`
      - `id` (uuid, primary key) - ID único del elemento
      - `playlist_id` (uuid) - ID de la playlist
      - `content_id` (uuid) - ID del contenido
      - `order_index` (integer) - Orden del elemento en la playlist
      - `created_at` (timestamp) - Fecha de creación

  2. Seguridad
    - Habilitar RLS en la tabla `playlist_items`
    - Política para que usuarios autenticados puedan leer elementos de playlists
    - Política para que admins y editores puedan gestionar elementos
*/

-- Crear tabla de elementos de playlist
CREATE TABLE IF NOT EXISTS playlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE,
  content_id uuid REFERENCES content(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(playlist_id, content_id)
);

-- Crear índice para optimizar consultas por playlist
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_order ON playlist_items(playlist_id, order_index);

-- Habilitar RLS
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Authenticated users can read playlist items"
  ON playlist_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE id = playlist_items.playlist_id 
      AND is_active = true
    )
  );

CREATE POLICY "Playlist owners can manage items"
  ON playlist_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE id = playlist_items.playlist_id 
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can manage any playlist items"
  ON playlist_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );