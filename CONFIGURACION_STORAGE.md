# Configuración de Supabase Storage para Archivos de Tareas

## Problema Identificado
Los archivos no se están subiendo a la tabla `archivos_tareas` porque el bucket de Supabase Storage no está configurado correctamente.

## Solución

### 1. Crear el Bucket en Supabase

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Navega a **Storage** en el menú lateral
3. Haz clic en **Create a new bucket**
4. Configura el bucket con estos valores:
   - **Name:** `task-files`
   - **Public bucket:** ✅ (marca esta casilla para que los archivos sean públicos)
   - Haz clic en **Create bucket**

### 2. Configurar Políticas de Seguridad (RLS)

Después de crear el bucket, necesitas configurar las políticas de acceso:

1. Ve al bucket `task-files` que acabas de crear
2. Haz clic en **Policies**
3. Crea las siguientes políticas:

#### Política para INSERT (Subir archivos)
```sql
-- Nombre: "Permitir subir archivos a usuarios autenticados"
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-files');
```

#### Política para SELECT (Ver archivos)
```sql
-- Nombre: "Permitir lectura pública de archivos"
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'task-files');
```

#### Política para DELETE (Eliminar archivos)
```sql
-- Nombre: "Permitir eliminar archivos a usuarios autenticados"
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'task-files');
```

### 3. Verificar la Tabla archivos_tareas

Asegúrate de que la tabla `archivos_tareas` exista con la siguiente estructura:

```sql
CREATE TABLE IF NOT EXISTS archivos_tareas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarea_id UUID NOT NULL REFERENCES tareas(id) ON DELETE CASCADE,
  nombre_archivo TEXT NOT NULL,
  url_archivo TEXT NOT NULL,
  tipo TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  fecha_subida TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_archivos_tareas_tarea_id ON archivos_tareas(tarea_id);
CREATE INDEX IF NOT EXISTS idx_archivos_tareas_usuario_id ON archivos_tareas(usuario_id);
```

### 4. Probar la Funcionalidad

Una vez configurado el bucket:

1. Abre tu aplicación
2. Ve a la página de Tareas
3. Abre el detalle de una tarea
4. Intenta subir un archivo usando el botón "Seleccionar archivo"
5. Verifica que:
   - El archivo se suba sin errores
   - Aparezca en la lista de "Archivos Adjuntos"
   - Se pueda abrir haciendo clic en el ícono de enlace
   - El registro aparezca en la tabla `archivos_tareas` en Supabase

### 5. Límites y Configuración

- **Tamaño máximo de archivo:** 10MB (configurable en el código)
- **Tipos de archivo permitidos:** Todos (configurable según necesidades)
- **Estructura de carpetas en Storage:** `tasks/{tarea_id}/{timestamp}_{filename}`

## Problemas Comunes

### Error: "Bucket not found"
- Verifica que el bucket se llame exactamente `task-files`
- Asegúrate de que esté marcado como público

### Error: "New row violates row-level security policy"
- Verifica que las políticas RLS estén configuradas correctamente
- Asegúrate de que el usuario esté autenticado

### Error: "Permission denied"
- Revisa las políticas de seguridad del bucket
- Verifica que el usuario tenga permisos de INSERT en storage.objects

## Cambios Realizados en el Código

He actualizado la función `handleFileUpload` en `TaskDetailDialog.jsx` para:

1. ✅ Mejorar el logging de errores
2. ✅ Agregar información del usuario al registro
3. ✅ Aumentar el límite de tamaño a 10MB
4. ✅ Simplificar el flujo - ya no guarda metadata sin storage
5. ✅ Mostrar errores más descriptivos al usuario

## Verificación

Para verificar que todo funciona correctamente:

```sql
-- Ver todos los archivos subidos
SELECT * FROM archivos_tareas ORDER BY fecha_subida DESC;

-- Ver archivos por tarea
SELECT * FROM archivos_tareas WHERE tarea_id = 'TU_TAREA_ID';

-- Ver espacio usado en el storage
SELECT 
  bucket_id,
  COUNT(*) as total_files,
  SUM((metadata->>'size')::bigint) as total_size_bytes
FROM storage.objects
WHERE bucket_id = 'task-files'
GROUP BY bucket_id;
```
