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
   DATABASE_URL="postgresql://<USUARIO>:<CONTRASE?A>@localhost:5432/data_circular_dev?schema=public"
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

Para aplicar las migraciones versionadas en la base de datos local:

```bash
npm run db:migrate
```

El registro solicita el tipo de participante (generador, reciclador, transportador o transformador). Las cuentas con rol `ADMIN` acceden al panel para listar, crear, editar y desactivar usuarios.

---

## 7. Credenciales del Usuario Administrador

Para probar y evaluar la aplicación con permisos completos de administración:

| Parámetro | Administrador Principal | Administrador Respaldo |
|---|---|---|
| **Correo Electrónico** | `admin@datacircular.com` | `admin@imara.org.co` |
| **Contraseña** | No se publica en el repositorio. Solicítala al administrador por un canal seguro. | No se publica en el repositorio. Solicítala al administrador por un canal seguro. |
| **Rol en Sistema** | `ADMIN` | `ADMIN` |
| **Pantalla Principal** | Redirige automáticamente a `/(app)/admin` | Redirige a `/(app)/admin` |

---

## 8. Ejecución de Pruebas Automatizadas

El proyecto cuenta con suites de pruebas automáticas completas tanto para backend como para frontend móvil y flujo integral de punta a punta:

```bash
# 1. Pruebas completas del backend (143 pruebas con Vitest y PostgreSQL)
npm run test:api

# 2. Pruebas de integración de la app móvil (Auth, almacenamiento seguro, perfil, soft-delete)
npm run test:mobile

# 3. Prueba integral de ciclo completo (Registro -> Publicación -> Chat -> Propuesta -> Logística -> Calificación -> KPIs)
npm run test:full

# 4. Limpieza destructiva de base de datos (solo desarrollo, requiere confirmación y contraseña por entorno)
npm run db:clean
```

---

## 9. Inicio del Backend

Modo desarrollo con recarga en caliente:
```bash
npm run dev:api
```

O modo servidor en producción/distribución:
```bash
npm run start:api
```

El servidor estará escuchando en:
- Consola de Verificación Interactiva: `http://localhost:3000/`
- Endpoint de Salud: `http://localhost:3000/api/v1/health`
- API Base: `http://localhost:3000/api/v1`

---

## 10. Inicio y Visualización de la Aplicación Móvil

La aplicación móvil de DATA_CIRCULAR está construida con **React Native**, **Expo SDK 57** y **Expo Router**, conectada en vivo con el backend con cobertura nacional en Colombia. Puedes ejecutarla de tres maneras:

### Opción A: En el Navegador Web de tu PC (Recomendada para pruebas rápidas)
Abre una terminal en VS Code y ejecuta:
```bash
npm run mobile:web
```
Se abrirá automáticamente en tu navegador predeterminado (o en `http://localhost:8081`). En el navegador puedes abrir las herramientas de desarrollador (`F12`), activar la vista de emulación de dispositivo móvil (icono de tablet/celular) y probar todos los flujos interactivos.

### Opción B: En tu Teléfono Celular Físico (Android o iPhone con Expo Go)
1. Instala la app gratuita **Expo Go** desde Google Play Store (Android) o App Store (iPhone).
2. Asegúrate de que tu celular y tu PC estén conectados a la **misma red Wi-Fi**.
3. En `apps/mobile/.env`, define la IP local de tu computador:
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.X:3000/api/v1
   ```
4. En la terminal de VS Code ejecuta:
   ```bash
   npm run dev:mobile
   ```
5. Escanea el **código QR** generado en la terminal.

### Opción C: Ejecución Concurrente Todo en Uno
```bash
npm run dev
```

---

## 11. Documentación Completa del Proyecto

En la carpeta [`docs/`](./docs) encontrarás la documentación exhaustiva del proyecto:
- 📖 [**Manual de Usuario Final**](./docs/manual-usuario.md) — *Guía paso a paso para Generadores, Recicladores y Transportadores*.
- 🛡️ [**Manual del Administrador**](./docs/manual-administrador.md) — *Guía de gobernanza, auditoría, KPIs y gestión de catálogo*.
- 🧪 [**Guía de Pruebas y Flujo del Proyecto**](./docs/guia-pruebas-y-flujo.md) — *Matriz de pruebas y diagrama de secuencia integral*.
- 🏛️ [Arquitectura del Sistema](./docs/arquitectura.md)
- 🗄️ [Modelo de Datos Relacional](./docs/modelo-datos.md)
- 📡 [Especificación de la API REST](./docs/api.md)
- 🔒 [Arquitectura de Seguridad y Habeas Data](./docs/seguridad.md)
- ⚖️ [Registro de Decisiones Técnicas (ADR)](./docs/decisiones-tecnicas.md)
- 📋 [Estrategia de Pruebas](./docs/plan-pruebas.md)
- 📁 [Catálogo Exhaustivo de Archivos](./docs/catalogo-archivos.md)
- 🎨 [Contratos de Interfaz de Usuario (UI)](./docs/ui-contracts.md)
- 💻 [Guía de Ejecución Local](./docs/ejecucion-local.md)

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
