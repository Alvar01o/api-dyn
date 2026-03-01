# 📘 Dynamic Schema Execution API

## 🧠 Descripción

Servicio backend que permite:

- Subir archivos `.sql`
- Crear dinámicamente bases de datos (MySQL / PostgreSQL)
- Aplicar schemas de forma asíncrona
- Ejecutar en background con workers
- Monitorear progreso en tiempo real
- Prevenir duplicados mediante hash
- Manejar archivos gigantes mediante streaming

Arquitectura basada en:

```
core (agnóstico)
api (REST)
worker (background jobs)
redis (queue + pub/sub)
```

---

# 🚀 Features Principales

## 📂 Upload de Schema

- Validación estricta de extensión `.sql`
- Sanitización de nombre de base de datos (regex segura)
- Tamaño configurable por `.env`
- Guardado temporal en `/tmp/schemas`

---

## 🗄 Creación Dinámica de Base de Datos

- Soporte para:
  - MySQL 8
  - PostgreSQL 13+
- Validación de existencia previa
- Opción configurable:
  - Fallar si ya existe
  - Permitir reutilizar

---

## 🔄 Aplicación Asíncrona del Schema

- Uso de **BullMQ + Redis**
- Worker dedicado
- No bloquea el request HTTP
- Tolerante a fallos

---

## 📊 Monitoreo de Progreso

### Endpoint REST

```
GET /schema/job/:id
```

### WebSocket

```
ws://host/ws
```

### Estados posibles

- queued
- running
- success
- failed

Progreso porcentual basado en bytes leídos.

---

## 🔐 Seguridad Implementada

- Rate limiting
- Idempotency key support
- SQL guard configurable
- Lista negra de keywords prohibidas
- Sanitización de identificadores
- Rollback automático en caso de fallo
- Drop de base de datos opcional si falla apply

---

## 🧾 Dedupe por Hash

- Cálculo SHA-256 en streaming
- Previene ejecuciones repetidas
- Configurable vía:

```
SCHEMA_DEDUPLICATE_BY_HASH=true
```

---

## 📦 Streaming para Archivos Gigantes

- No carga el `.sql` completo en memoria
- Usa:
  - `mysql` CLI
  - `psql` CLI
- Soporta archivos de varios GB

---

# 🏗 Arquitectura

```
API
 ├── Upload
 ├── Job creation
 ├── Queue enqueue
 ├── Job status endpoint
 └── WebSocket server

Worker
 ├── SQL validation
 ├── DB creation
 ├── Streaming apply
 ├── Progress publish
 └── Cleanup

Redis
 ├── BullMQ queue
 └── Pub/Sub progreso
```

---

# ⚙️ Variables de Entorno

## Infraestructura

```
REDIS_HOST
REDIS_PORT
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
```

---

## Configuración de Schema

```
SCHEMA_TMP_PATH
SCHEMA_JOB_STORE_PATH
SCHEMA_FAIL_IF_DB_EXISTS
SCHEMA_DROP_DB_ON_FAILURE
DELETE_SCHEMA_AFTER_APPLY
SCHEMA_DEDUPLICATE_BY_HASH
SCHEMA_ENABLE_SQL_GUARD
SCHEMA_FORBIDDEN_KEYWORDS
SCHEMA_DRY_RUN
```

---

## Seguridad

```
RATE_LIMIT_WINDOW_MS
RATE_LIMIT_MAX
SCHEMA_ENABLE_IDEMPOTENCY
```

---

# 🐳 Docker

Incluye:

- API container
- Worker container
- Redis
- MySQL
- PostgreSQL

Requiere instalación de:

- mysql-client
- postgresql-client

para soportar streaming execution.

---

# 📡 Endpoints

## POST `/schema/upload`

**Body (multipart/form-data):**

- engine: `mysql | postgres`
- name: database name
- schema: `.sql` file

**Response:**

```json
{
  "success": true,
  "jobId": "uuid"
}
```

---

## GET `/schema/job/:id`

**Response:**

```json
{
  "id": "...",
  "status": "running",
  "progress": 62,
  "stage": "applying-schema"
}
```

---

# 🔌 WebSocket

Conectar:

```
ws://localhost:3000/ws
```

Enviar:

```json
{
  "type": "subscribe",
  "jobId": "..."
}
```

Eventos posibles:

- progress
- done
- failed

---

# 🧪 Modo Dry Run

Permite validar SQL sin ejecutar:

```
SCHEMA_DRY_RUN=true
```

---

# 🧯 Manejo de Fallos

- Si falla aplicación:
  - Marca job como failed
  - Publica evento WebSocket
  - Opcionalmente elimina base creada
- Logging de stderr de mysql/psql

---

# 📈 Estado Actual del Proyecto

✔ Background processing  
✔ Streaming execution  
✔ Dedupe inteligente  
✔ Websocket progreso  
✔ Seguridad básica  
✔ Configuración dinámica  
✔ Arquitectura modular  

---

# 🔮 Próximas Mejoras Sugeridas

- Autenticación + RBAC
- Multi-tenant DB credentials
- Prometheus metrics
- Structured logging (pino)
- Persistencia de jobs en base interna
- Panel web React

---

# 📌 Requisitos

- Node 20+
- Redis 7+
- MySQL 8+
- PostgreSQL 13+
- Docker recomendado