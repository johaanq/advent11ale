# Arquitectura del Proyecto - Adventale

## Resumen
Este documento define qué información y funcionalidad va en el **Frontend** (hardcodeado) y qué va en el **Backend** (Supabase) para mantener la sincronización entre dispositivos.

---

## 📱 FRONTEND (Hardcodeado en el código)

### ✅ Información de Regalos (Estática)
- **Títulos** de cada regalo
- **Descripciones** (corta y completa)
- **Imágenes** (rutas a archivos estáticos)
- **Colores** y estilos visuales
- **Día** y nombre del día (8, 9, 10, 11 de diciembre)
- **Orden** de los regalos

**Razón**: Esta información no cambia y es parte del diseño/UX de la aplicación.

---

### ✅ Preguntas del Quiz (Estáticas)
- **Preguntas** completas
- **Opciones** de respuesta (A, B, C, D)
- **Índice de respuesta correcta** (0, 1, 2, 3)

**Razón**: Las preguntas son parte del contenido estático. Sin embargo, para mayor seguridad, las respuestas correctas podrían ir en el backend (ver consideraciones abajo).

---

### ✅ UI/UX y Componentes
- Componentes React
- Animaciones
- Estilos y temas
- Lógica de presentación

---

## 🗄️ BACKEND (Supabase)

### ✅ Estado Global de Regalos Abiertos
**Tabla: `opened_gifts`**
```sql
- id (uuid, primary key)
- gift_id (integer) -- ID del regalo (1, 2, 3, 4)
- opened_at (timestamp) -- Fecha y hora exacta de apertura
- created_at (timestamp)
- UNIQUE(gift_id) -- Solo puede haber un registro por regalo
```

**Funcionalidad**:
- Guardar qué regalos se han abierto (estado global compartido)
- Cualquier persona que entre verá los mismos regalos abiertos
- Consultar regalos abiertos para sincronizar entre dispositivos
- Usar para mostrar el estado en el calendario (íconos navideños)

**Nota**: Sin autenticación - estado compartido para todos los usuarios.

---

### ✅ Restricción de Un Regalo por Día
**Tabla: `app_state`** (Estado global de la aplicación)
```sql
- id (integer, primary key, default 1) -- Solo una fila
- last_gift_opened_date (date) -- Última fecha en que se abrió un regalo
- updated_at (timestamp)
```

**Funcionalidad**:
- Verificar si ya se abrió un regalo hoy (globalmente)
- Bloquear apertura de múltiples regalos el mismo día
- Sincronizar entre dispositivos
- Solo una fila en la tabla (singleton pattern)

**Alternativa más simple**: Podríamos usar solo `opened_gifts` y calcular la última fecha desde ahí.

---

### ❌ Autenticación (NO NECESARIA)
**No se requiere autenticación** porque:
- Es una aplicación pública con estado compartido
- Cualquiera que entre ve el mismo estado
- No hay usuarios individuales
- Más simple y directo

---

## 🤔 DECISIONES PENDIENTES

### 1. Respuestas Correctas del Quiz
**Opción A - Frontend (Actual)**:
- ✅ Más rápido de implementar
- ✅ No requiere consultas al backend
- ❌ Menos seguro (respuestas visibles en el código)

**Opción B - Backend**:
- ✅ Más seguro (respuestas no visibles)
- ✅ Permite cambiar respuestas sin actualizar el frontend
- ❌ Requiere consulta al backend para validar

**Recomendación**: Para una app personal/romántica, **Frontend está bien**. Si quieres más seguridad, backend.

---

### 2. Historial de Respuestas del Quiz
**¿Guardar las respuestas dadas?**
- Si quieres analizar qué respuestas se dieron
- Si quieres mostrar estadísticas
- Si quieres permitir revisar respuestas anteriores

**Tabla sugerida: `quiz_answers`**:
```sql
- id (uuid)
- user_id (uuid)
- gift_id (integer)
- question_index (integer)
- selected_answer (integer)
- is_correct (boolean)
- answered_at (timestamp)
```

---

### 3. Bloqueo por Fecha (CountdownLock)
**¿En backend o frontend?**
- **Frontend**: Más simple, pero puede ser manipulado cambiando la fecha del sistema
- **Backend**: Más seguro, pero requiere consulta

**Recomendación**: Para una app personal, **frontend está bien**. El usuario puede cambiar la fecha del sistema, pero si es para tu novia, probablemente no lo hará.

---

## 📊 ESTRUCTURA DE TABLAS SUPABASE

### Tabla 1: `opened_gifts` (Estado Global)
```sql
CREATE TABLE opened_gifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_id INTEGER NOT NULL UNIQUE, -- Solo puede haber un registro por regalo
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_opened_gifts_gift_id ON opened_gifts(gift_id);
```

**Ejemplo de datos**:
```
gift_id | opened_at
--------|-------------------
1       | 2024-12-08 10:30:00
2       | 2024-12-09 14:20:00
```

---

### Tabla 2: `app_state` (Estado Global de la Aplicación)
```sql
CREATE TABLE app_state (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Solo una fila
  last_gift_opened_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar fila inicial
INSERT INTO app_state (id, last_gift_opened_date) 
VALUES (1, NULL);
```

**Alternativa más simple**: No necesitamos esta tabla si calculamos `last_gift_opened_date` desde `opened_gifts`:
```sql
SELECT MAX(opened_at::date) as last_gift_opened_date 
FROM opened_gifts;
```

---

### Tabla 3: `quiz_answers` (Opcional - si quieres guardar respuestas)
```sql
CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_id INTEGER NOT NULL,
  question_index INTEGER NOT NULL,
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Nota**: Sin `user_id` porque no hay autenticación.

---

## 🔄 FLUJO DE DATOS

### Al abrir un regalo:
1. **Frontend**: Muestra el quiz con preguntas hardcodeadas
2. **Usuario**: Responde las preguntas
3. **Frontend**: Valida respuestas (hardcodeadas)
4. **Backend**: Si correcto, inserta en `opened_gifts` (o actualiza si ya existe)
5. **Backend**: Actualiza `app_state.last_gift_opened_date` (o calcula desde `opened_gifts`)
6. **Frontend**: Actualiza UI mostrando el regalo como abierto
7. **Todos los dispositivos**: Verán el regalo como abierto (estado compartido)

### Al cargar la página:
1. **Backend**: Consulta `opened_gifts` (sin filtro de usuario)
2. **Frontend**: Recibe lista de regalos abiertos (estado global)
3. **Frontend**: Muestra calendario con íconos en fechas abiertas
4. **Frontend**: Filtra regalos abiertos del árbol 3D
5. **Cualquier persona**: Ve el mismo estado al entrar

---

## ✅ RESUMEN EJECUTIVO

### Frontend (Hardcodeado):
- ✅ Información de regalos (títulos, descripciones, imágenes)
- ✅ Preguntas y opciones del quiz
- ✅ Respuestas correctas (índices)
- ✅ UI/UX completa

### Backend (Supabase):
- ✅ Estado global de regalos abiertos (`opened_gifts`) - **SIN autenticación**
- ✅ Última fecha de regalo abierto (`app_state` o calculado desde `opened_gifts`)
- ✅ Sincronización entre dispositivos (estado compartido para todos)
- ⚠️ Respuestas correctas (opcional, para más seguridad)
- ⚠️ Historial de respuestas (opcional, para analytics)
- ❌ **NO requiere autenticación** - estado público compartido

---

## 🚀 PRÓXIMOS PASOS

1. Crear proyecto en Supabase
2. Crear tablas según el diseño (sin autenticación)
3. Configurar políticas RLS (Row Level Security) para permitir lectura/escritura pública o anónima
4. Instalar cliente de Supabase en el proyecto (`@supabase/supabase-js`)
5. Migrar lógica de `localStorage` a Supabase
6. Implementar sincronización en tiempo real (opcional, con `supabase.realtime`)

### Configuración de Seguridad en Supabase:
```sql
-- Permitir lectura pública
ALTER TABLE opened_gifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON opened_gifts FOR SELECT USING (true);

-- Permitir inserción pública (o solo desde tu aplicación con API key)
CREATE POLICY "Allow public insert" ON opened_gifts FOR INSERT WITH CHECK (true);
```

**Nota**: Para producción, considera usar API keys y restringir escritura solo desde tu aplicación.

