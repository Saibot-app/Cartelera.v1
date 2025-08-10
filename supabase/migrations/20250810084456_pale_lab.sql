/*
  # CONFIGURACIÓN COMPLETA PARA EDGE FUNCTIONS
  
  Este archivo contiene:
  1. Verificación de configuración actual
  2. Permisos adicionales si son necesarios
  3. Datos de prueba para testing
  4. Instrucciones para variables de entorno
*/

-- =============================================================================
-- 1. VERIFICAR CONFIGURACIÓN ACTUAL
-- =============================================================================

SELECT 'VERIFICACIÓN: Tablas principales' as step;
SELECT 
  schemaname, 
  tablename, 
  CASE WHEN c.relrowsecurity THEN 'RLS_ENABLED' ELSE 'RLS_DISABLED' END as rls_status
FROM pg_tables pt
LEFT JOIN pg_class c ON c.relname = pt.tablename
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'companies', 'company_users')
ORDER BY tablename;

SELECT 'VERIFICACIÓN: Permisos service_role' as step;
SELECT 
  table_name,
  COUNT(*) as permission_count
FROM information_schema.role_table_grants 
WHERE table_schema = 'public'
  AND grantee = 'service_role'
  AND table_name IN ('users', 'companies', 'company_users')
GROUP BY table_name
ORDER BY table_name;

SELECT 'VERIFICACIÓN: Datos existentes' as step;
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'companies' as table_name, COUNT(*) as record_count FROM companies
UNION ALL  
SELECT 'company_users' as table_name, COUNT(*) as record_count FROM company_users;

-- =============================================================================
-- 2. ASEGURAR PERMISOS COMPLETOS PARA SERVICE_ROLE
-- =============================================================================

SELECT 'CONFIGURACIÓN: Aplicando permisos para service_role' as step;

-- Permisos explícitos para todas las tablas
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- Permisos específicos para auth schema (si son necesarios)
GRANT USAGE ON SCHEMA auth TO service_role;

-- =============================================================================
-- 3. CREAR EMPRESA DE PRUEBA SI NO EXISTE
-- =============================================================================

SELECT 'CONFIGURACIÓN: Verificando empresa de prueba' as step;

-- Insertar empresa de prueba si no existe
INSERT INTO companies (
  id,
  name,
  company_id,
  primary_color,
  secondary_color,
  accent_color,
  is_active,
  subscription_plan,
  max_users,
  max_screens
)
SELECT 
  gen_random_uuid(),
  'Empresa de Prueba Edge Function',
  'test-edge-company',
  '#3B82F6',
  '#1E40AF', 
  '#F59E0B',
  true,
  'basic',
  10,
  5
WHERE NOT EXISTS (
  SELECT 1 FROM companies WHERE company_id = 'test-edge-company'
);

-- Mostrar ID de la empresa de prueba para usar en tests
SELECT 
  'EMPRESA DE PRUEBA PARA EDGE FUNCTION' as info,
  id as company_uuid,
  name,
  company_id
FROM companies 
WHERE company_id = 'test-edge-company';

-- =============================================================================
-- 4. VERIFICACIÓN FINAL
-- =============================================================================

SELECT 'VERIFICACIÓN FINAL: Resumen de configuración' as step;

SELECT 
  'TABLAS' as category,
  COUNT(*) as total
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'companies', 'company_users')

UNION ALL

SELECT 
  'PERMISOS_SERVICE_ROLE' as category,
  COUNT(DISTINCT table_name) as total
FROM information_schema.role_table_grants 
WHERE table_schema = 'public'
  AND grantee = 'service_role'
  AND table_name IN ('users', 'companies', 'company_users')

UNION ALL

SELECT 
  'EMPRESAS_DISPONIBLES' as category,
  COUNT(*) as total
FROM companies 
WHERE is_active = true;

-- =============================================================================
-- 5. INSTRUCCIONES PARA VARIABLES DE ENTORNO
-- =============================================================================

SELECT '
🚨 IMPORTANTE: CONFIGURAR VARIABLES DE ENTORNO MANUALMENTE 🚨

Las siguientes configuraciones NO se pueden hacer con SQL.
Debes configurarlas en Supabase Dashboard:

1. Ve a: Edge Functions → Secrets

2. Configura estas variables EXACTAS:
   
   Variable 1:
   Nombre: PROJECT_URL
   Valor: https://wcempgkpnfsmoyjktzdr.supabase.co
   
   Variable 2:  
   Nombre: SERVICE_ROLE_KEY
   Valor: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZW1wZ2twbmZzbW95amt0emRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTczMTExMywiZXhwIjoyMDY1MzA3MTEzfQ.wCW6Cc1DFs3otKn0oqoppmOAdnGo795hFXp99XtIA2c

3. Elimina cualquier variable con nombres diferentes (SUPABASE_URL, etc)

4. Redeploya la Edge Function después de configurar las variables

5. Usa el company_uuid mostrado arriba para hacer pruebas
' as instrucciones_importantes;

SELECT 'CONFIGURACIÓN COMPLETA - Ahora configura las variables de entorno manualmente' as final_message;