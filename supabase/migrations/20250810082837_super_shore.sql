-- =====================================================
-- AUDITORIA COMPLETA DE CONFIGURACIÓN SUPABASE
-- =====================================================
-- Este script verifica el estado completo de la base de datos
-- para identificar problemas de configuración

-- =====================================================
-- 1. VERIFICAR ESTRUCTURA DE TABLAS
-- =====================================================
SELECT 'AUDITORIA: Verificando estructura de tablas' as audit_step;

-- Verificar que todas las tablas existan
SELECT 
  pt.schemaname, 
  pt.tablename, 
  pt.tableowner,
  CASE WHEN pc.relrowsecurity THEN 'YES' ELSE 'NO' END as "RLS_Enabled"
FROM pg_tables pt
LEFT JOIN pg_class pc ON pc.relname = pt.tablename AND pc.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = pt.schemaname)
WHERE pt.schemaname = 'public' 
  AND pt.tablename IN ('users', 'companies', 'company_users', 'screens', 'content', 'playlists', 'playlist_items', 'schedules')
ORDER BY pt.tablename;

-- =====================================================
-- 2. VERIFICAR COLUMNAS CRÍTICAS
-- =====================================================
SELECT 'AUDITORIA: Verificando columnas críticas' as audit_step;

-- Verificar columnas de users
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- Verificar columnas de companies
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'companies'
ORDER BY ordinal_position;

-- Verificar columnas de company_users
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'company_users'
ORDER BY ordinal_position;

-- =====================================================
-- 3. VERIFICAR FOREIGN KEYS
-- =====================================================
SELECT 'AUDITORIA: Verificando foreign keys' as audit_step;

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 4. VERIFICAR POLÍTICAS RLS
-- =====================================================
SELECT 'AUDITORIA: Verificando políticas RLS' as audit_step;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- 5. VERIFICAR TRIGGERS
-- =====================================================
SELECT 'AUDITORIA: Verificando triggers' as audit_step;

SELECT 
  event_object_table as table_name,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 6. VERIFICAR FUNCIONES PERSONALIZADAS
-- =====================================================
SELECT 'AUDITORIA: Verificando funciones personalizadas' as audit_step;

SELECT 
  routine_name,
  routine_type,
  data_type as return_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
  AND routine_name IN ('email', 'uid', 'is_global_admin', 'is_member', 'set_created_by', 'set_updated_at', 'update_updated_at_column')
ORDER BY routine_name;

-- =====================================================
-- 7. VERIFICAR DATOS EXISTENTES
-- =====================================================
SELECT 'AUDITORIA: Verificando datos existentes' as audit_step;

-- Contar registros en cada tabla
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'companies' as table_name, COUNT(*) as record_count FROM companies
UNION ALL
SELECT 'company_users' as table_name, COUNT(*) as record_count FROM company_users
UNION ALL
SELECT 'screens' as table_name, COUNT(*) as record_count FROM screens
UNION ALL
SELECT 'content' as table_name, COUNT(*) as record_count FROM content
UNION ALL
SELECT 'playlists' as table_name, COUNT(*) as record_count FROM playlists
UNION ALL
SELECT 'playlist_items' as table_name, COUNT(*) as record_count FROM playlist_items
UNION ALL
SELECT 'schedules' as table_name, COUNT(*) as record_count FROM schedules
ORDER BY table_name;

-- =====================================================
-- 8. VERIFICAR USUARIOS DE AUTH
-- =====================================================
SELECT 'AUDITORIA: Verificando usuarios en auth.users' as audit_step;

-- Verificar usuarios en auth
SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at,
  updated_at,
  raw_user_meta_data->>'full_name' as full_name_from_auth
FROM auth.users
ORDER BY created_at DESC;

-- =====================================================
-- 9. VERIFICAR SINCRONIZACIÓN AUTH <-> PUBLIC.USERS
-- =====================================================
SELECT 'AUDITORIA: Verificando sincronización auth <-> public.users' as audit_step;

-- Usuarios en auth pero no en public.users
SELECT 
  'AUTH_MISSING_IN_PUBLIC' as issue,
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Usuarios en public.users pero no en auth
SELECT 
  'PUBLIC_MISSING_IN_AUTH' as issue,
  pu.id,
  pu.email,
  pu.full_name
FROM public.users pu
LEFT JOIN auth.users au ON pu.id = au.id
WHERE au.id IS NULL;

-- =====================================================
-- 10. VERIFICAR RELACIONES COMPANY_USERS
-- =====================================================
SELECT 'AUDITORIA: Verificando relaciones company_users' as audit_step;

-- Verificar integridad de relaciones
SELECT 
  cu.user_id,
  cu.company_id,
  cu.role as company_role,
  cu.is_active,
  u.email,
  u.full_name,
  u.role as user_table_role,
  c.name as company_name,
  c.company_id as company_code
FROM company_users cu
LEFT JOIN users u ON cu.user_id = u.id
LEFT JOIN companies c ON cu.company_id = c.id
ORDER BY cu.created_at DESC;

-- =====================================================
-- 11. VERIFICAR PERMISOS DE SERVICIO
-- =====================================================
SELECT 'AUDITORIA: Verificando permisos de servicio' as audit_step;

-- Verificar que service_role tenga permisos
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public'
  AND grantee = 'service_role'
  AND table_name IN ('users', 'companies', 'company_users')
ORDER BY table_name, privilege_type;

-- =====================================================
-- 12. VERIFICAR TIPOS ENUM
-- =====================================================
SELECT 'AUDITORIA: Verificando tipos ENUM' as audit_step;

SELECT 
  n.nspname as schema_name,
  t.typname as enum_name,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- =====================================================
-- 13. VERIFICAR CONFIGURACIÓN AUTH
-- =====================================================
SELECT 'AUDITORIA: Verificando configuración de auth' as audit_step;

-- Verificar configuración de auth (si es accesible)
SELECT 
  'auth.users_count' as metric,
  COUNT(*) as value
FROM auth.users

UNION ALL

SELECT 
  'auth.confirmed_users_count' as metric,
  COUNT(*) as value
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL

UNION ALL

SELECT 
  'auth.recent_signups' as metric,
  COUNT(*) as value
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '24 hours';

-- =====================================================
-- 14. DIAGNÓSTICO DE PROBLEMAS COMUNES
-- =====================================================
SELECT 'AUDITORIA: Diagnóstico de problemas comunes' as audit_step;

-- Problema 1: Usuarios sin empresa
SELECT 
  'USERS_WITHOUT_COMPANY' as issue,
  COUNT(*) as affected_count
FROM users 
WHERE company_id IS NULL;

-- Problema 2: Company_users orphaned
SELECT 
  'ORPHANED_COMPANY_USERS' as issue,
  COUNT(*) as affected_count
FROM company_users cu
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = cu.user_id)
   OR NOT EXISTS (SELECT 1 FROM companies c WHERE c.id = cu.company_id);

-- Problema 3: Empresas sin usuarios
SELECT 
  'COMPANIES_WITHOUT_USERS' as issue,
  COUNT(*) as affected_count
FROM companies c
WHERE NOT EXISTS (SELECT 1 FROM company_users cu WHERE cu.company_id = c.id);

-- Problema 4: RLS no habilitado
SELECT 
  'TABLES_WITHOUT_RLS' as issue,
  COUNT(*) as affected_count
FROM pg_tables pt
LEFT JOIN pg_class pc ON pc.relname = pt.tablename AND pc.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = pt.schemaname)
WHERE pt.schemaname = 'public' 
  AND pt.tablename IN ('users', 'companies', 'company_users', 'screens', 'content', 'playlists', 'playlist_items', 'schedules')
  AND (pc.relrowsecurity IS NULL OR pc.relrowsecurity = false);

-- =====================================================
-- 15. RECOMENDACIONES DE CONFIGURACIÓN
-- =====================================================
SELECT 'AUDITORIA: Generando recomendaciones' as audit_step;

-- Esta es una consulta informativa
SELECT 
  'AUDITORIA COMPLETADA' as status,
  'Revisa los resultados anteriores para identificar problemas' as message,
  NOW() as timestamp;

-- =====================================================
-- 16. VERIFICAR STORAGE BUCKET
-- =====================================================
SELECT 'AUDITORIA: Verificando Storage Buckets' as audit_step;

SELECT 
  id,
  name,
  public as is_public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
ORDER BY created_at DESC;

-- =====================================================
-- RESUMEN FINAL
-- =====================================================
SELECT 'RESUMEN: La auditoría ha terminado. Revisa cada sección para identificar problemas.' as final_message;