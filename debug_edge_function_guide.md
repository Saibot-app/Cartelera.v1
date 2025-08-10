# 🔍 GUÍA DE DEBUGGING EDGE FUNCTIONS

## 📋 PASOS PARA AUDITAR SUPABASE

### 1. **Ejecutar Auditoría SQL**
```sql
-- Ejecuta el archivo audit_complete_configuration.sql en SQL Editor
-- Esto te dará un reporte completo del estado actual
```

### 2. **Verificar Variables de Entorno Edge Function**
Ve a Supabase Dashboard → Edge Functions → Secrets:

**✅ Variables que DEBEN existir:**
- `PROJECT_URL` = https://wcempgkpnfsmoyjktzdr.supabase.co
- `SERVICE_ROLE_KEY` = tu_service_role_key

**❌ Variables que NO deben existir:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. **Ver Logs de Edge Function en Tiempo Real**

1. **Abrir Logs:**
   - Ve a Edge Functions → `create-company-user` → **Logs**
   - Mantén esta pestaña abierta

2. **Hacer una Prueba:**
   - Ve a Edge Functions → `create-company-user` → **Invoke**
   - Payload de prueba:
   ```json
   {
     "email": "test@demo.com",
     "full_name": "Test User",
     "company_id": "put-real-company-uuid-here"
   }
   ```

3. **Analizar el Error:**
   - Los logs te dirán EXACTAMENTE dónde falla
   - Busca mensajes como:
     - "Missing env variables"
     - "Company not found"
     - "User creation failed"
     - "Permission denied"

### 4. **Problemas Comunes y Soluciones**

#### ❌ **Error: Missing environment variables**
**Solución:** Configurar variables en Edge Functions → Secrets

#### ❌ **Error: Company not found**
**Solución:** 
```sql
-- Verificar que existe la empresa
SELECT id, name, company_id FROM companies;
-- Usar el UUID real en el payload
```

#### ❌ **Error: Permission denied**
**Solución:** Ejecutar SQL de permisos:
```sql
-- Dar permisos al service_role
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.companies TO service_role;
GRANT ALL ON public.company_users TO service_role;
```

#### ❌ **Error: Auth user creation failed**
**Solución:** Verificar SERVICE_ROLE_KEY:
```sql
-- En SQL Editor, probar si el service role funciona
SELECT auth.uid(); -- Debe retornar NULL
```

### 5. **Diagnóstico Paso a Paso**

#### **Paso A: Verificar Base de Datos**
```sql
-- ¿Existen las tablas?
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- ¿Hay datos de prueba?
SELECT COUNT(*) FROM companies;
SELECT id, name, company_id FROM companies LIMIT 5;
```

#### **Paso B: Verificar Permisos**
```sql
-- ¿Service role tiene permisos?
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE grantee = 'service_role' AND table_schema = 'public';
```

#### **Paso C: Verificar RLS**
```sql
-- ¿Están las políticas correctas?
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 6. **Test Manual de Edge Function**

#### **Test Básico (Sin Dependencies):**
```javascript
// Crear una Edge Function simple para probar conectividad
Deno.serve(async (req) => {
  const PROJECT_URL = Deno.env.get('PROJECT_URL');
  const SERVICE_KEY = Deno.env.get('SERVICE_ROLE_KEY');
  
  return new Response(JSON.stringify({
    success: true,
    has_project_url: !!PROJECT_URL,
    has_service_key: !!SERVICE_KEY,
    url_preview: PROJECT_URL ? PROJECT_URL.substring(0, 20) + '...' : 'missing'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

### 7. **Checklist de Configuración**

- [ ] Variables de entorno configuradas correctamente
- [ ] Edge Function redesplegada después de cambiar variables
- [ ] Permisos SQL ejecutados para service_role
- [ ] Buckets de Storage creados (si se necesitan)
- [ ] Políticas RLS configuradas
- [ ] Datos de prueba en tablas (especialmente companies)

### 8. **Contacto de Emergencia**

Si después de toda la auditoría sigue fallando:

1. **Comparte el resultado completo de la auditoría SQL**
2. **Comparte los logs exactos de la Edge Function**
3. **Confirma qué variables de entorno tienes configuradas**
4. **Indica si redesplegaste la function después de cambiar variables**

### 9. **Herramientas de Debugging**

#### **Console Logging en Edge Function:**
```typescript
console.log('Step 1: Validating input...');
console.log('Step 2: Creating Supabase client...');
console.log('Step 3: Checking company exists...');
// etc.
```

#### **Response Debugging:**
```typescript
// Retornar información de debug en development
if (Deno.env.get('DEBUG_MODE') === 'true') {
  return new Response(JSON.stringify({
    debug: true,
    env_vars: {
      has_project_url: !!PROJECT_URL,
      has_service_key: !!SERVICE_KEY
    },
    payload: payload
  }));
}
```