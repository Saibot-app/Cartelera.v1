/*
  # Crear trigger para perfiles de usuario

  1. Función para crear perfil automáticamente
    - Se ejecuta cuando un usuario se registra en Supabase Auth
    - Crea automáticamente un registro en la tabla users
    - Asigna rol 'viewer' por defecto

  2. Trigger
    - Se activa en INSERT en auth.users
    - Extrae datos del usuario y los inserta en public.users
*/

-- Función para crear perfil de usuario automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'viewer'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que se ejecuta cuando se crea un nuevo usuario
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();