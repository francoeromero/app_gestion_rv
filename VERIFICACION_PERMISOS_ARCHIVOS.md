# Verificación de Permisos para Archivos Adjuntos

## ✅ Verificaciones Necesarias en Supabase

Para asegurarte de que todos los usuarios puedan ver los archivos adjuntos, necesitas verificar y configurar lo siguiente:

---

## 1. 🗄️ Políticas RLS en la Tabla `archivos_tareas`

Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/srkkhadypryfcselzfhr

### A. Verificar si RLS está habilitado

1. Ve a **Database** → **Tables** → `archivos_tareas`
2. En la pestaña **Policies**, verifica el estado de RLS

### B. Configurar Políticas de Lectura (SELECT)

Ejecuta este SQL en el **SQL Editor**:

```sql
-- Permitir que todos los usuarios autenticados vean TODOS los archivos
CREATE POLICY "Permitir lectura pública de archivos"
ON archivos_tareas
FOR SELECT
TO authenticated
USING (true);

-- O si prefieres permitir solo a usuarios autenticados ver archivos de tareas a las que tienen acceso
-- (más seguro pero requiere que la tabla tareas tenga relación con usuarios)
CREATE POLICY "Permitir lectura de archivos por usuarios autenticados"
ON archivos_tareas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM tareas 
    WHERE tareas.id = archivos_tareas.tarea_id
  )
);
```

### C. Verificar Políticas de Inserción (INSERT)

```sql
-- Permitir que usuarios autenticados suban archivos
CREATE POLICY "Permitir inserción de archivos"
ON archivos_tareas
FOR INSERT
TO authenticated
WITH CHECK (true);
```

---

## 2. 📦 Políticas de Storage en el Bucket `promos-images`

### A. Verificar Configuración del Bucket

1. Ve a **Storage** → `promos-images`
2. Verifica que esté marcado como **Public bucket**

### B. Configurar Políticas de Storage

Ejecuta este SQL:

```sql
-- Política para permitir lectura pública de todos los archivos
CREATE POLICY "Public Access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'promos-images');

-- Política para permitir a usuarios autenticados subir archivos
CREATE POLICY "Authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'promos-images');

-- Política para permitir a usuarios autenticados actualizar archivos
CREATE POLICY "Authenticated users can update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'promos-images');
```

---

## 3. 🔍 Verificar las Políticas Existentes

### Para la tabla `archivos_tareas`:

```sql
-- Ver todas las políticas actuales de archivos_tareas
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
WHERE tablename = 'archivos_tareas';
```

### Para el Storage:

```sql
-- Ver todas las políticas de storage
SELECT 
  policyname,
  tablename,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';
```

---

## 4. 🧪 Pruebas para Verificar Permisos

### Test 1: Verificar que la consulta funciona

Ejecuta en SQL Editor:

```sql
-- Esto debería devolver todos los archivos si los permisos están bien
SELECT * FROM archivos_tareas;
```

### Test 2: Verificar acceso al Storage

1. Copia una URL de archivo de la tabla `archivos_tareas`
2. Pégala en una ventana de incógnito del navegador
3. Si el archivo se muestra/descarga → ✅ Los permisos están correctos
4. Si da error 401/403 → ❌ Necesitas ajustar las políticas de storage

---

## 5. 📝 Configuración Recomendada (COPY-PASTE)

Ejecuta todo este bloque en el SQL Editor de Supabase:

```sql
-- ========================================
-- CONFIGURACIÓN COMPLETA DE PERMISOS
-- ========================================

-- 1. Habilitar RLS en archivos_tareas (si no está habilitado)
ALTER TABLE archivos_tareas ENABLE ROW LEVEL SECURITY;

-- 2. Borrar políticas antiguas conflictivas (si existen)
DROP POLICY IF EXISTS "Permitir lectura pública de archivos" ON archivos_tareas;
DROP POLICY IF EXISTS "Permitir inserción de archivos" ON archivos_tareas;

-- 3. Crear políticas para archivos_tareas
CREATE POLICY "Permitir lectura pública de archivos"
ON archivos_tareas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Permitir inserción de archivos"
ON archivos_tareas
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir actualización de archivos"
ON archivos_tareas
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Permitir eliminación de archivos"
ON archivos_tareas
FOR DELETE
TO authenticated
USING (true);

-- 4. Borrar políticas antiguas de storage (si existen)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;

-- 5. Crear políticas para el Storage (promos-images)
CREATE POLICY "Public Access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'promos-images');

CREATE POLICY "Authenticated users can upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'promos-images');

CREATE POLICY "Authenticated users can update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'promos-images');

CREATE POLICY "Authenticated users can delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'promos-images');

-- 6. Verificar configuración
SELECT 'Políticas de archivos_tareas' as tipo, COUNT(*) as cantidad 
FROM pg_policies 
WHERE tablename = 'archivos_tareas'
UNION ALL
SELECT 'Políticas de storage' as tipo, COUNT(*) as cantidad 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

---

## 6. 🚨 Problemas Comunes

### Problema: "Error: new row violates row-level security policy"
**Solución:** Las políticas de INSERT/UPDATE no permiten la operación. Ejecuta las políticas del punto 5.

### Problema: "403 Forbidden" al acceder al archivo
**Solución:** El bucket no es público o faltan políticas de SELECT en storage.objects.

### Problema: Los usuarios no ven los archivos en la interfaz
**Solución:** Verifica que las políticas de SELECT en `archivos_tareas` permitan lectura.

---

## 7. ✅ Checklist Final

- [ ] RLS está habilitado en `archivos_tareas`
- [ ] Existe política SELECT en `archivos_tareas` para usuarios autenticados
- [ ] Existe política INSERT en `archivos_tareas` para usuarios autenticados
- [ ] El bucket `promos-images` está marcado como público
- [ ] Existe política SELECT pública en `storage.objects` para `promos-images`
- [ ] Existe política INSERT en `storage.objects` para usuarios autenticados
- [ ] Probaste abrir una URL de archivo en ventana de incógnito
- [ ] Probaste desde otra cuenta de usuario

---

## 8. 🧑‍💻 Prueba Práctica

1. **Usuario A** sube un archivo a una tarea
2. **Usuario B** abre la misma tarea
3. **Usuario B** debería ver el archivo y poder descargarlo
4. Si no funciona, revisa los pasos anteriores

---

## Notas Importantes

- ⚠️ Si usas `TO public` en lugar de `TO authenticated`, cualquier persona sin autenticar podrá ver los archivos
- ✅ `TO authenticated` solo permite a usuarios logueados
- 🔒 Para más seguridad, puedes agregar validaciones basadas en roles o relaciones entre tablas
