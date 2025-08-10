/*
  # Crear tabla de usuarios

  1. Nueva Tabla
    - `users`
      - `id` (uuid, primary key) - ID único del usuario
      - `email` (text, unique) - Email del usuario
      - `full_name` (text) - Nombre completo del usuario
      - `role` (enum) - Rol del usuario (admin, editor, viewer)
      - `created_at` (timestamp) - Fecha de creación
      - `updated_at` (timestamp) - Fecha de última actualización

  2. Seguridad
    - Habilitar RLS en la tabla `users`
    - Política para que usuarios autenticados puedan leer sus propios datos
    - Política para que usuarios autenticados puedan actualizar sus propios datos
*/

-- Crear tipo enum para roles
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role user_role DEFAULT 'viewer',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();