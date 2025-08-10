# SignagePro - Sistema de Señalización Digital

## Descripción del Proyecto

SignagePro es una aplicación web completa para gestión de contenido de señalización digital. Permite a los usuarios crear, gestionar y mostrar contenido multimedia en pantallas digitales de forma programada y organizada.

## Tecnologías Utilizadas

### Frontend
- **React 18.3.1** - Biblioteca principal de UI
- **TypeScript** - Tipado estático
- **Vite** - Bundler y servidor de desarrollo
- **Tailwind CSS** - Framework de estilos
- **React Router DOM** - Enrutamiento
- **React Hook Form** - Gestión de formularios
- **Yup** - Validación de esquemas
- **Lucide React** - Iconografía
- **Date-fns** - Manipulación de fechas
- **Recharts** - Gráficos y visualizaciones

### Backend y Base de Datos
- **Supabase** - Backend as a Service
- **PostgreSQL** - Base de datos principal
- **Supabase Storage** - Almacenamiento de archivos
- **Row Level Security (RLS)** - Seguridad a nivel de fila
- **Supabase Auth** - Sistema de autenticación

### Herramientas de Desarrollo
- **ESLint** - Linting de código
- **PostCSS** - Procesamiento de CSS
- **Autoprefixer** - Prefijos CSS automáticos

## Arquitectura del Sistema

### Estructura de Archivos
```
src/
├── components/
│   ├── auth/
│   │   └── AuthForm.tsx          # Formulario de autenticación
│   ├── Content/
│   │   ├── ContentForm.tsx       # Formulario de creación de contenido
│   │   ├── ContentList.tsx       # Lista de contenidos
│   │   └── ContentPreview.tsx    # Vista previa de contenido
│   ├── Dashboard/
│   │   ├── DashboardOverview.tsx # Vista general del dashboard
│   │   └── StatsCard.tsx         # Tarjetas de estadísticas
│   ├── Display/
│   │   └── DisplayScreen.tsx     # Pantalla de reproducción
│   ├── Layout/
│   │   ├── Header.tsx            # Cabecera de la aplicación
│   │   └── Sidebar.tsx           # Barra lateral de navegación
│   └── Screens/
│       └── ScreensList.tsx       # Lista de pantallas
├── contexts/
│   └── AuthContext.tsx           # Contexto de autenticación
├── hooks/
│   ├── useAuth.ts                # Hook de autenticación
│   └── useContent.ts             # Hook de gestión de contenido
├── lib/
│   ├── supabase.ts               # Cliente de Supabase
│   └── storage.ts                # Servicio de almacenamiento
├── pages/
│   ├── ContentPage.tsx           # Página de gestión de contenido
│   ├── DashboardPage.tsx         # Página principal
│   ├── DisplayPage.tsx           # Página de visualización
│   ├── PlaylistsPage.tsx         # Página de playlists
│   ├── SchedulesPage.tsx         # Página de programación
│   ├── ScreensPage.tsx           # Página de pantallas
│   └── SettingsPage.tsx          # Página de configuración
├── types/
│   └── database.ts               # Tipos de TypeScript para la BD
├── App.tsx                       # Componente principal
├── main.tsx                      # Punto de entrada
└── index.css                     # Estilos globales
```

### Base de Datos

#### Esquema Principal
- **users** - Usuarios del sistema con roles (admin, editor, viewer)
- **screens** - Pantallas digitales registradas
- **content** - Contenido multimedia (texto, imagen, video, HTML)
- **playlists** - Listas de reproducción de contenido
- **playlist_items** - Relación entre playlists y contenido
- **schedules** - Programación de contenido por pantalla y horario

#### Tipos de Datos Personalizados
- **user_role** - ENUM: admin, editor, viewer
- **screen_status** - ENUM: online, offline, maintenance
- **content_type** - ENUM: text, image, video, html

#### Seguridad
- **Row Level Security (RLS)** habilitado en todas las tablas
- **Políticas granulares** por rol de usuario
- **Triggers automáticos** para actualización de timestamps
- **Validaciones a nivel de base de datos**

### Sistema de Autenticación

#### Configuración
- **Email/Password** - Método principal de autenticación
- **Sin confirmación de email** - Para facilitar desarrollo
- **Roles de usuario** - Sistema de permisos basado en roles
- **Sesiones persistentes** - Manejo automático de tokens

#### Flujo de Autenticación
1. Usuario se registra con email, contraseña y nombre completo
2. Se crea automáticamente un registro en la tabla `users` via trigger
3. Se asigna rol por defecto 'viewer'
4. Sesión se mantiene automáticamente

### Sistema de Almacenamiento

#### Configuración de Seguridad
- **Bucket privado** - No accesible públicamente
- **Organización por usuario** - `content/userId/timestamp-random.ext`
- **Validación de tipos** - Solo imágenes y videos permitidos
- **Límite de tamaño** - 50MB máximo por archivo
- **URLs firmadas** - Acceso temporal y seguro

#### Tipos de Archivo Soportados
- **Imágenes**: JPG, PNG, GIF, WEBP
- **Videos**: MP4, WEBM, OGG

## Funcionalidades Implementadas

### Dashboard
- **Estadísticas en tiempo real** - Pantallas, contenido, programaciones
- **Actividad reciente** - Log de eventos del sistema
- **Estado de pantallas** - Monitoreo en vivo

### Gestión de Contenido
- **Creación de contenido** - Texto, imágenes, videos, HTML
- **Vista previa** - Previsualización antes de publicar
- **Gestión de estado** - Activar/desactivar contenido
- **Eliminación segura** - Con confirmación

### Pantalla de Reproducción
- **Reproducción automática** - Rotación de contenido
- **Controles de navegación** - Play/pause, anterior/siguiente
- **Modo pantalla completa** - Para displays dedicados
- **Indicadores de progreso** - Barra de progreso y puntos

### Gestión de Pantallas
- **Registro de pantallas** - Nombre, ubicación, resolución
- **Monitoreo de estado** - Online/offline/mantenimiento
- **Última conexión** - Timestamp de última actividad

## Configuración del Entorno

### Variables de Entorno Requeridas
```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

### Instalación y Configuración
1. **Clonar el proyecto**
2. **Instalar dependencias**: `npm install`
3. **Configurar variables de entorno** en `.env`
4. **Ejecutar migraciones** en Supabase
5. **Iniciar servidor de desarrollo**: `npm run dev`

## Migraciones de Base de Datos

### Archivos de Migración Existentes
- `20250810010701_rough_cave.sql` - Configuración inicial
- `20250810010707_light_wildflower.sql` - Tablas principales
- `20250810010715_misty_union.sql` - Relaciones y constraints
- `20250810010725_plain_spark.sql` - Políticas RLS
- `20250810010733_green_coast.sql` - Triggers y funciones
- `20250810010740_quick_morning.sql` - Índices de rendimiento
- `20250810010752_wandering_moon.sql` - Validaciones adicionales
- `20250810010807_young_glitter.sql` - Configuración final
- `create_storage_bucket.sql` - Configuración de almacenamiento

## Errores Actuales y Problemas Técnicos

### 1. Error Principal: "StorageService is not defined"

**Descripción del Error:**
```
ReferenceError: StorageService is not defined
```

**Contexto:**
- Ocurre en `ContentForm.tsx` línea donde se llama `StorageService.ensureBucketExists()`
- El error sugiere que la importación del `StorageService` no está funcionando correctamente
- Esto impide la subida de archivos (imágenes y videos)

**Ubicación del Error:**
- Archivo: `src/components/Content/ContentForm.tsx`
- Función: `uploadFile()` dentro del componente `ContentForm`
- Línea específica: `await StorageService.ensureBucketExists()`

**Importación Actual:**
```typescript
// En ContentForm.tsx - FALTA ESTA IMPORTACIÓN
import { StorageService } from '../../lib/storage'
```

### 2. Error Secundario: "Bucket not found"

**Descripción del Error:**
```json
{
  "statusCode": "404",
  "error": "Bucket not found", 
  "message": "Bucket not found"
}
```

**Contexto:**
- Error de Supabase Storage API
- El bucket 'content-files' no existe en el proyecto de Supabase
- Las migraciones SQL no pueden crear buckets de Storage automáticamente
- Requiere configuración manual en el dashboard de Supabase o creación programática

**URLs de Error:**
```
https://wcempgkpnfsmoyjktzdr.supabase.co/storage/v1/object/content-files/[userId]/[timestamp].jpg
```

### 3. Problemas de Configuración de Storage

**Configuración Actual:**
- Bucket name: 'content-files' (no existe)
- Políticas RLS: Definidas en migración pero bucket no creado
- Validaciones: Implementadas pero no funcionales sin bucket

**Configuración Requerida:**
- Crear bucket manualmente en Supabase Dashboard
- O implementar creación automática via código
- Configurar políticas de acceso correctas
- Establecer límites de archivo y tipos MIME

## Soluciones Propuestas para Desarrollador Avanzado

### Opción 1: Creación Manual del Bucket
1. Acceder al Dashboard de Supabase
2. Ir a Storage > Buckets
3. Crear bucket 'content-files' con configuración:
   - Público: No
   - Límite de archivo: 50MB
   - Tipos MIME permitidos: image/*, video/*

### Opción 2: Creación Programática
```typescript
// Implementar en StorageService
static async createBucketIfNotExists() {
  const { data, error } = await supabase.storage.createBucket('content-files', {
    public: false,
    allowedMimeTypes: ['image/*', 'video/*'],
    fileSizeLimit: 50 * 1024 * 1024
  })
  // Manejar resultado
}
```

### Opción 3: Usar Bucket Existente
- Modificar para usar bucket 'avatars' que existe por defecto
- Organizar archivos en subcarpetas para evitar conflictos
- Ajustar políticas RLS existentes

## Configuración de Políticas RLS para Storage

### Políticas Requeridas
```sql
-- Política de inserción
CREATE POLICY "Users can upload own content" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'content-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política de lectura
CREATE POLICY "Users can read own content" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'content-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Política de eliminación
CREATE POLICY "Users can delete own content" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'content-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Estado Actual del Proyecto

### Funcionalidades Operativas
- ✅ Autenticación de usuarios
- ✅ Dashboard con estadísticas
- ✅ Navegación entre páginas
- ✅ Gestión de pantallas
- ✅ Lista de contenido (sin archivos)
- ✅ Pantalla de reproducción con contenido demo

### Funcionalidades Bloqueadas
- ❌ Subida de archivos (imágenes/videos)
- ❌ Creación de contenido multimedia
- ❌ Almacenamiento en Supabase Storage
- ❌ Vista previa de contenido con archivos

### Próximos Pasos Recomendados
1. **Resolver error de StorageService** - Verificar importaciones
2. **Configurar bucket de Storage** - Manual o programáticamente
3. **Probar subida de archivos** - Validar funcionamiento completo
4. **Implementar políticas RLS** - Para Storage si no existen
5. **Completar funcionalidades pendientes** - Playlists, programación

## Información Técnica Adicional

### Estructura de la Base de Datos
- 6 tablas principales con relaciones FK
- 3 tipos ENUM personalizados
- RLS habilitado en todas las tablas
- Triggers automáticos para timestamps
- Políticas granulares por rol de usuario

### Sistema de Roles
- **Admin**: Acceso completo a todo el sistema
- **Editor**: Puede crear y gestionar contenido
- **Viewer**: Solo lectura de contenido público

### Configuración de Seguridad
- Autenticación obligatoria para todas las funciones
- Validación de tipos de archivo en frontend y backend
- Límites de tamaño de archivo (50MB)
- Organización de archivos por usuario
- URLs firmadas para acceso temporal

## Contacto y Soporte

Para resolver los errores actuales, se recomienda:
1. Revisar la configuración del proyecto de Supabase
2. Verificar permisos de Storage
3. Confirmar que las migraciones se ejecutaron correctamente
4. Probar la creación manual del bucket como solución temporal

---

*Documentación generada el 10 de enero de 2025*