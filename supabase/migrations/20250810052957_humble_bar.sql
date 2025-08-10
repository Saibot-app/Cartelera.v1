/*
  # Actualizar trigger de creación de usuario para sistema multiempresa
  
  Modifica la función handle_new_user para:
  1. Detectar si el usuario es super admin global
  2. Asignar empresa apropiada o crear nueva si es necesario
  3. Asignar rol apropiado según el contexto
*/

-- Función actualizada para manejar nuevos usuarios en sistema multiempresa
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_company_id uuid;
    user_role user_role;
BEGIN
    -- Verificar si es el super admin global
    IF NEW.email = 'saibot.app@gmail.com' THEN
        -- Para super admin global, no asignamos empresa específica inicialmente
        -- Se asignará cuando seleccione/cree una empresa
        INSERT INTO users (id, email, full_name, role, company_id)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Super Administrador Global'),
            'super_admin',
            NULL  -- Sin empresa específica inicialmente
        );
    ELSE
        -- Para usuarios regulares, necesitan ser invitados por un admin
        -- Por ahora, asignamos a la primera empresa activa como fallback
        SELECT id INTO default_company_id 
        FROM companies 
        WHERE activo = true 
        ORDER BY created_at 
        LIMIT 1;
        
        -- Si no hay empresas, crear una empresa por defecto
        IF default_company_id IS NULL THEN
            INSERT INTO companies (
                name, 
                id_empresa, 
                email, 
                color_primario, 
                color_secundario, 
                color_acento
            ) VALUES (
                'Mi Empresa',
                'COMPANY001',
                NEW.email,
                '#1F2937',
                '#3B82F6',
                '#10B981'
            ) RETURNING id INTO default_company_id;
        END IF;
        
        -- Insertar usuario con rol audience por defecto
        INSERT INTO users (id, email, full_name, role, company_id)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuario'),
            'audience',
            default_company_id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();