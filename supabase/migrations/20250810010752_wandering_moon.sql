/*
  # Insertar datos de ejemplo

  1. Datos de ejemplo
    - Pantallas de muestra en diferentes ubicaciones
    - Contenido de ejemplo de diferentes tipos
    - Playlist básica con contenido
    - Programación de ejemplo

  2. Notas
    - Los datos se insertan solo si las tablas están vacías
    - Se crean usuarios de ejemplo para testing
*/

-- Insertar pantallas de ejemplo
INSERT INTO screens (name, location, resolution, status, last_seen) VALUES
  ('Recepción Principal', 'Lobby - Planta Baja', '1920x1080', 'online', now() - interval '5 minutes'),
  ('Sala de Conferencias', 'Piso 2 - Sala A', '1920x1080', 'online', now() - interval '2 hours'),
  ('Cafetería', 'Planta Baja - Área Social', '1366x768', 'offline', now() - interval '1 day'),
  ('Entrada Principal', 'Exterior - Entrada', '3840x2160', 'maintenance', now() - interval '30 minutes')
ON CONFLICT DO NOTHING;

-- Insertar contenido de ejemplo (solo si no existe contenido)
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Obtener el primer usuario admin o crear uno temporal
  SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    -- Crear usuario temporal para los datos de ejemplo
    INSERT INTO users (email, full_name, role) 
    VALUES ('admin@example.com', 'Administrador Sistema', 'admin')
    RETURNING id INTO admin_user_id;
  END IF;

  -- Insertar contenido de ejemplo
  INSERT INTO content (title, type, content_data, duration, created_by) VALUES
    (
      'Bienvenida Corporativa',
      'text',
      '{"text": "Bienvenidos a nuestra empresa", "fontSize": "48px", "color": "#1F2937", "backgroundColor": "#F3F4F6", "textAlign": "center"}',
      8,
      admin_user_id
    ),
    (
      'Promoción Enero 2025',
      'image',
      '{"url": "https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080", "alt": "Promoción especial de enero"}',
      10,
      admin_user_id
    ),
    (
      'Horarios de Atención',
      'html',
      '{"html": "<div style=\"display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; font-family: Arial, sans-serif;\"><h1 style=\"font-size: 4rem; margin-bottom: 2rem; font-weight: bold;\">Horarios de Atención</h1><div style=\"font-size: 2rem; line-height: 1.5;\"><p>Lunes a Viernes: 8:00 AM - 6:00 PM</p><p>Sábados: 9:00 AM - 2:00 PM</p><p style=\"margin-top: 1rem; font-size: 1.5rem; opacity: 0.9;\">¡Te esperamos!</p></div></div>"}',
      12,
      admin_user_id
    ),
    (
      'Noticias Corporativas',
      'text',
      '{"text": "Últimas noticias y actualizaciones de la empresa", "fontSize": "36px", "color": "#FFFFFF", "backgroundColor": "#2563EB", "textAlign": "center"}',
      6,
      admin_user_id
    ),
    (
      'Video Promocional',
      'video',
      '{"url": "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4", "autoplay": true, "muted": true, "loop": true}',
      15,
      admin_user_id
    )
  ON CONFLICT DO NOTHING;

END $$;