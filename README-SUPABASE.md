# Configuración de Supabase

## Pasos para configurar Supabase

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Espera a que se complete la configuración (puede tomar unos minutos)

### 2. Obtener credenciales

1. En tu proyecto de Supabase, ve a **Settings** → **API**
2. Copia los siguientes valores:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **anon/public key** (la clave pública)

### 3. Configurar variables de entorno

1. Crea un archivo `.env.local` en la raíz del proyecto (si no existe)
2. Agrega las siguientes variables:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_project_url_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

**Ejemplo:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Crear la tabla en Supabase

1. En Supabase, ve a **SQL Editor**
2. Abre el archivo `supabase-setup.sql` de este proyecto
3. Copia y pega todo el contenido en el SQL Editor
4. Ejecuta el script (botón "Run")

Esto creará:
- La tabla `opened_gifts`
- Los índices necesarios
- Las políticas de seguridad (RLS) para permitir lectura/escritura pública

### 5. Verificar la configuración

1. Reinicia tu servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre la aplicación en el navegador
3. Intenta abrir un regalo
4. Verifica en Supabase → **Table Editor** → `opened_gifts` que se haya creado el registro

## Estructura de la tabla

La tabla `opened_gifts` tiene la siguiente estructura:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | UUID | ID único del registro |
| `gift_id` | INTEGER | ID del regalo (1, 2, 3, 4) - ÚNICO |
| `opened_at` | TIMESTAMP | Fecha y hora de apertura |
| `created_at` | TIMESTAMP | Fecha de creación del registro |

## Sincronización en tiempo real

La aplicación está configurada para sincronizarse automáticamente entre dispositivos usando Supabase Realtime. Cuando un regalo se abre en un dispositivo, todos los demás dispositivos verán el cambio automáticamente.

## Funciones disponibles

- `getOpenedGifts()`: Obtiene todos los regalos abiertos
- `openGift(giftId)`: Marca un regalo como abierto
- `getLastGiftOpenedDate()`: Obtiene la última fecha de apertura
- `subscribeToOpenedGifts(callback)`: Suscripción a cambios en tiempo real

## Troubleshooting

### Error: "Invalid API key"
- Verifica que las variables de entorno estén correctamente configuradas
- Asegúrate de usar la clave `anon/public`, no la `service_role`

### Error: "relation does not exist"
- Verifica que hayas ejecutado el script SQL en Supabase
- Revisa que la tabla `opened_gifts` exista en el Table Editor

### No se sincroniza entre dispositivos
- Verifica que Realtime esté habilitado en Supabase (Settings → API → Realtime)
- Asegúrate de que las políticas RLS permitan lectura/escritura

### Los regalos no se guardan
- Revisa la consola del navegador para errores
- Verifica las políticas RLS en Supabase
- Asegúrate de que la tabla tenga los permisos correctos

