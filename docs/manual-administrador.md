# DATA_CIRCULAR — Manual del Administrador
**Guía Operativa y Técnica para la Dirección y Auditoría Distrital**
**Fundación IMARA • Versión 1.0 Oficial**

---

## 1. Rol y Responsabilidades del Administrador de Plataforma

El rol de **Administrador (`ADMIN`)** en **DATA_CIRCULAR** está reservado para el equipo de dirección, interventoría ambiental y coordinación técnica de la **Fundación IMARA**. Sus responsabilidades incluyen:

1. **Gobernanza y Verificación Institucional**: Validar la autenticidad y documentación jurídica de las organizaciones (asociaciones de recicladores de oficio, empresas comerciales, cooperativas y fundaciones).
2. **Monitoreo de Impacto Circular Distrital**: Supervisar en tiempo real los indicadores distritales de masa recuperada (toneladas de material desviadas del relleno sanitario Doña Juana), emisiones de CO2 evitadas y tasa de cumplimiento.
3. **Custodia y Evolución del Catálogo**: Administrar las categorías, subcategorías y unidades de medida técnica de materiales aprovechables según las dinámicas de mercado de Bogotá D.C.
4. **Gestión de Cuentas y Seguridad**: Administrar usuarios, moderar conductas inapropiadas, asignar roles y aplicar medidas de suspensión o reactivación bajo directrices de la Ley 1581 de 2012.
5. **Auditoría Logística y Resolución de Conflictos**: Supervisar el cumplimiento de operaciones logísticas, transporte y pesajes en báscula.

---

## 2. Credenciales Maestras Preconfiguradas

Para labores de prueba, homologación, auditoría y evaluación del proyecto, se encuentran configuradas en base de datos las siguientes cuentas con privilegios completos de administrador:

| Parámetro | Administrador Principal | Administrador Respaldo IMARA |
|---|---|---|
| **Correo Electrónico** | `admin@datacircular.com` | `admin@imara.org.co` |
| **Contraseña Maestra** | No se almacena en la documentación; solicitarla por un canal seguro. | No se almacena en la documentación; solicitarla por un canal seguro. |
| **Rol en Sistema** | `ADMIN` | `ADMIN` |
| **Tipo de Usuario** | `GENERATOR` (Institucional) | `GENERATOR` (Institucional) |
| **Estado** | `ACTIVE` | `ACTIVE` |
| **Tratamiento de Datos** | Política `1.0-draft` Aceptada | Política `1.0-draft` Aceptada |

> [!NOTE]
> Las credenciales de acceso no se versionan. Las contraseñas deben provisionarse y compartirse mediante un canal seguro.

---

## 3. Acceso y Navegación del Panel de Administración

Al iniciar sesión con una cuenta de rol `ADMIN`, el sistema redirige automáticamente a la pantalla de administración:
- **Ruta**: `app/(app)/admin.tsx`
- **Submódulos Disponibles mediante Pestañas Superiores**:
  1. 🏢 **Verificación de Organizaciones**
  2. 📊 **KPIs e Indicadores Distritales**
  3. 📦 **Catálogo de Materiales y Unidades**
  4. ⚙️ **Parámetros y Auditoría**
- **Gestión Global de Usuarios**: acceso mediante el botón *"Gestionar Usuarios"* del perfil.
- La pestaña de **Reportes** de ejemplo fue retirada del panel.

---

## 4. Módulos del Panel Administrativo Paso a Paso

### 4.1 Módulo 1: Verificación de Organizaciones (Due Diligence)
- **Propósito**: Garantizar que solo asociaciones de recicladores legítimas y empresas formalizadas operen con sello de verificación en el ecosistema distrital.
- **Flujo de Trabajo**:
  1. En la pestaña **"Verificación"**, se despliegan las organizaciones con estado `PENDING` o `UNVERIFIED`.
  2. Al pulsar sobre una organización, se abre la ficha de auditoría que presenta:
     - Razón social y Nombre comercial.
     - Número de Identificación Tributaria (NIT / RUT).
     - Tipo de entidad (`EMPRESA`, `ASOCIACIÓN`, `FUNDACIÓN`, `COOPERATIVA`, `INSTITUCIÓN`).
     - Dirección de la sede y Localidad de Bogotá (ej: *Puente Aranda*).
     - Representante legal y miembros vinculados.
     - Enlace al certificado o documento cargado (Cámara de Comercio / Registro Único de Organizaciones de Recicladores RUOR).
  3. **Decisión del Administrador**:
     - **Aprobar (`VERIFIED`)**: Se le otorga la insignia verde de *"Organización Verificada"*, habilitando un factor de confianza superior en el motor de coincidencias.
     - **Rechazar (`REJECTED`)**: Se debe ingresar obligatoriamente una nota explicativa que se notifica a los directivos de la organización para que subsanen la documentación.

---

### 4.2 Módulo 2: Tablero de Control de KPIs e Impacto Distrital
- **Propósito**: Generar reportes técnicos automatizados sobre el balance de masa de la economía circular en Bogotá.
- **Métricas Principales Calculadas en Tiempo Real**:
  - **Toneladas Totales Recuperadas (`tonsRecoveredTotal`)**: Sumatoria acumulada del peso neto verificado de todas las operaciones cerradas con éxito.
  - **Toneladas Recuperadas en el Mes (`tonsRecoveredThisMonth`)**: Volumen aprovechado durante el ciclo mensual vigente.
  - **Emisiones de CO2 Evitadas (Estimado)**: Factor de conversión ambiental aplicado según el tipo de material desviado de disposición final.
  - **Tasa de Éxito de Negociaciones**: Porcentaje de propuestas aceptadas que culminan exitosamente en operaciones cerradas.
  - **Satisfacción Promedio del Ecosistema**: Calificación promedio (1.0 a 5.0 ⭐) resultante de las evaluaciones mutuas.
- **Reporte Territorial por Localidades**:
  - En **Indicadores → Economía Circular**, gráfico de los cinco municipios/localidades con más operaciones. Muestra el conteo de operaciones y las toneladas recuperadas en operaciones cerradas.
- **Balance de Masa por Categoría de Material**:
  - Gráfico de las cinco categorías principales con más movimiento, con barras separadas para kilogramos ofrecidos en publicaciones y kilogramos recuperados en operaciones cerradas. Las subcategorías se agrupan bajo su categoría principal.
  - Los gráficos usan los agregados reales de `/admin/reports/localities` y `/admin/reports/materials`; si no hay actividad, el panel lo indica en vez de mostrar valores de ejemplo.

---

### 4.3 Módulo 3: Catálogo Oficial de Materiales y Unidades de Medida
- **Propósito**: Mantener normalizada la taxonomía de materiales aprovechables para evitar confusiones en los pesajes y negociaciones.
- **Estructura del Catálogo Base (Protegido)**:
  - **11 categorías principales** y 77 subcategorías enumeradas.
  - **75 subcategorías activas**; residuos hospitalarios y equipos con PCB permanecen inactivos hasta decisión jurídica. Las opciones del catálogo anterior se conservan inactivas para proteger referencias históricas.
  - **6 Unidades de Medida Homologadas**: Kilogramo (`kg`), Tonelada (`ton`), Unidad (`und`), Litro (`l`), Metro cúbico (`m3`), Bulto/Saco (`bulto`).
- **Acciones Disponibles para el Administrador**:
  - **Crear Nueva Categoría o Subcategoría**: Definir nombre técnico, descripción y categoría padre (si aplica).
  - **Editar Categoría**: Actualizar descripciones o estado (`Activo` / `Inactivo`).
  - **Crear Nueva Unidad de Medida**: Nombre completo y abreviatura estandarizada.

> [!IMPORTANT]
> Ninguna publicación de material puede realizarse sobre una categoría principal sin subcategoría. Esto garantiza que cada transacción tenga especificación técnica exacta.

---

### 4.4 Gestión Integral de Usuarios
- **Ruta**: `app/(app)/users.tsx`
- **Capacidades del Administrador**:
  1. **Búsqueda Dinámica**: Búsqueda en tiempo real por nombre, correo electrónico o tipo de participante.
  2. **Modificación de Roles**:
     - Elevar un usuario regular a `ADMIN`.
     - Revocar permisos de `ADMIN` a `USER`.
  3. **Control de Estado de Cuentas**:
     - `ACTIVE`: Cuenta plenamente operativa.
     - `INACTIVE`: Cuenta deshabilitada temporalmente.
     - `SUSPENDED`: Cuenta bloqueada por incumplimiento de términos o fraude.
  4. **Eliminación Permanente (`/permanent`)**:
     - Elimina el registro de la base de datos de manera definitiva.
     - **Regla de Protección Absoluta**: El sistema bloquea automáticamente cualquier intento de auto-eliminación de la cuenta con la que el administrador está autenticado actualmente.

---

## 5. Mantenimiento y Reinicio de la Base de Datos

Para restablecer la plataforma a un estado limpio de prueba en cualquier momento futuro sin afectar el catálogo oficial, ejecute desde la terminal en la raíz del proyecto:

```bash
npm run db:clean
```

### ¿Qué hace exactamente este comando?
1. **Protege y preserva el catálogo**: Las 11 categorías principales, sus 77 subcategorías (75 activas) y las 6 unidades de medida se conservan; las categorías hospitalarias y los equipos con PCB permanecen inactivos.
2. **Protege las credenciales maestras**: Recrea o valida las cuentas administrativas. No guardes contraseñas en archivos del proyecto ni las compartas fuera de un canal seguro.
3. **Elimina en cascada todos los movimientos**: Borra evaluaciones, evidencias, operaciones logísticas, propuestas comerciales, mensajes de chat, conversaciones y publicaciones de prueba.
4. **Elimina organizaciones y usuarios temporales**: Deja la base de datos lista y ligera para una nueva demostración.

---

## 6. Comprobación Rápida de Salud del Sistema (Health Check)

El administrador puede auditar el estado del servidor y PostgreSQL abriendo en su navegador:
- URL: `http://localhost:3000/api/v1/health`

Respuesta esperada:
```json
{
  "success": true,
  "data": {
    "service": "DATA_CIRCULAR API",
    "status": "healthy",
    "environment": "development",
    "timestamp": "2026-10-21T...",
    "database": {
      "status": "connected",
      "latencyMs": 12
    }
  }
}
```
Si el estado de la base de datos indica `"connected"`, todos los servicios móviles y de escritorio operarán de forma óptima.
