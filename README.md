# DATA_CIRCULAR

Plataforma colaborativa para conectar generadores, transportadores, recuperadores y transformadores de materiales recuperables, desarrollada en el contexto del proyecto de práctica universitaria con la **Fundación IMARA**.

---

## 1. Requisitos Previos

- **Node.js**: `v20.x` o `v22.x` (Verificado con `v22.16.0`)
- **npm**: `v10.x` o superior (Verificado con `10.9.2`)
- **Git**: `v2.x` (Verificado con `2.54.0`)
- **PostgreSQL**: `v16` o `v18` local en ejecución en el puerto 5432 (o Docker Compose)

---

## 2. Versiones Verificadas en el Entorno

| Componente | Versión |
| :--- | :--- |
| Node.js | `22.16.0` |
| npm | `10.9.2` |
| PostgreSQL | `18.6` |
| Express | `4.21.2` |
| Prisma ORM | `6.4.1` |
| TypeScript | `5.6.3` |
| Vitest | `2.1.8` |

---

## 3. Instalación de Dependencias

Desde la raíz del proyecto, ejecuta:

```bash
npm install
```

Esto instalará las dependencias de todos los workspaces (`apps/api`, `apps/mobile`, `packages/shared`).

---

## 4. Configuración de Variables de Entorno

1. Copia el archivo de ejemplo para el backend:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
2. Edita `apps/api/.env` con tus credenciales locales de PostgreSQL:
   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/data_circular_dev?schema=public"
   ```

---

## 5. Creación de la Base de Datos

Si usas PostgreSQL local:
```sql
CREATE DATABASE data_circular_dev;
```

O si utilizas Docker Compose:
```bash
docker compose up -d
```

---

## 6. Generación del Cliente Prisma

```bash
npm run db:generate
```

---

## 7. Ejecución de Pruebas Automatizadas

Para ejecutar las pruebas del backend con Vitest y Supertest:

```bash
npm run test:api
```

---

## 8. Inicio del Backend

Modo desarrollo con recarga en caliente:
```bash
npm run dev:api
```

El servidor estará escuchando en:
- API Base: `http://localhost:3000/api/v1`
- Endpoint de Salud: `http://localhost:3000/api/v1/health`

---

## 9. Inicio de la Aplicación Móvil (Fase 5)

```bash
npm --workspace=apps/mobile run start
```

---

## 10. Documentación Completa del Proyecto

En la carpeta [`docs/`](./docs) encontrarás:
- [Arquitectura del Sistema](./docs/arquitectura.md)
- [Modelo de Datos](./docs/modelo-datos.md)
- [Especificación de la API REST](./docs/api.md)
- [Arquitectura de Seguridad](./docs/seguridad.md)
- [Registro de Decisiones Técnicas (ADR)](./docs/decisiones-tecnicas.md)
- [Estrategia de Pruebas](./docs/plan-pruebas.md)
- [Catálogo Exhaustivo de Archivos](./docs/catalogo-archivos.md)

---

## 11. Solución de Errores Frecuentes

- **Error de conexión a PostgreSQL (`P1001: Can't reach database server`)**:
  - Verifica que el servicio de PostgreSQL esté en ejecución:
    ```powershell
    Get-Service *postgres*
    ```
  - Comprueba que la contraseña y el puerto 5432 en `apps/api/.env` sean correctos.
- **Error `DATABASE_UNAVAILABLE` en `/api/v1/health`**:
  - Asegúrate de haber creado la base de datos `data_circular_dev`.
