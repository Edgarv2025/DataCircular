# Evaluación de rendimiento y registro de pruebas de DATA_CIRCULAR

**Revisión estática y cambios:** 2 de noviembre de 2026
**Alcance:** app móvil Expo/React Native, API Express y consultas Prisma/PostgreSQL.

## Cuellos de botella encontrados y corregidos

1. **Búsqueda móvil en inicio:** escribir en el buscador reconstruía la función de consulta y disparaba una petición de publicaciones por cada cambio de texto. Además, la carga inicial solicitaba publicaciones dos veces. El texto ahora filtra localmente el resultado ya descargado y solo cambian las consultas al cambiar categoría/filtros; la carga inicial de publicaciones ocurre una vez y las respuestas antiguas no pisan el filtro más reciente.
2. **Expiración de publicaciones:** cada búsqueda ejecutaba un `UPDATE` global de publicaciones expiradas antes de consultar resultados. La búsqueda ya excluye vencidas usando `expiresAt`; se eliminó esa escritura repetida del camino de lectura.
3. **Conteos de mensajes no leídos:** la bandeja hacía una consulta por conversación y el indicador global hacía una consulta por conversación. Ambos conteos ahora se resuelven en una consulta SQL agregada por llamada.
4. **Telemetría por solicitud:** al superar 2.000 sesiones, el middleware recorría el mapa completo en cada petición; el histórico de solicitudes también usaba `Array.shift()` en cada inserción después del límite. La limpieza se limita a una pasada por minuto y el historial de 5.000 peticiones usa reemplazo circular de costo constante.
5. **Sondeo móvil de no leídos:** el indicador consultaba cada 15 segundos en cada barra montada. Ahora solo sondea en la pantalla enfocada y evita consultas simultáneas.

## Registro de pruebas realizadas y resultados

| Prueba | Comando / alcance | Resultado | Mejora o cobertura |
|---|---|---|---|
| Contraste y navegación móvil | `npm --workspace=apps/mobile run test:ui-quality` | **Correcta: 12 verificaciones.** Contrastes medidos: secciones naranjas 4.50:1; acento en bienvenida/login 5.05:1; acciones naranjas 4.50:1; badge 4.50:1; texto sobre cabecera naranja 5.04:1; texto principal/secundario en naranja claro 13.78:1 y 4.92:1; serie de gráfica 4.50:1; acción verde 5.35:1; botón Inicio 6.30:1. Verificadas rutas de Inicio, retorno sin historial y salida del panel administrador al perfil. | Confirma el mínimo WCAG definido para los pares comprobados y la ruta válida de salida del panel. |
| Navegación web de administrador | Expo Web en `apps/mobile`, sesión y respuestas API simuladas; perfil → panel → flecha/Perfil → perfil | **Correcta.** Ambos controles del panel regresaron a `/profile`; Inicio desde el perfil regresó a `/admin`. No apareció el error `removeChild`. | Confirma que el administrador puede salir del panel y volver a él desde su perfil. Las respuestas API fueron simuladas, así que no valida integración con backend. |
| Gráficos administrativos de actividad | Expo Web en `apps/mobile`, respuestas simuladas de `/admin/reports/localities` y `/admin/reports/materials`; abrir Indicadores | **Correcta.** Se mostraron el gráfico de sectores, categorías, valores de kg y operaciones; no apareció `removeChild`. | Verifica que las barras consumen el formato de los agregados existentes y presentan oferta y recuperación por separado. No demuestra conexión con datos reales ni rendimiento móvil físico. |
| TypeScript móvil | `npx tsc --noEmit -p apps/mobile/tsconfig.json` | **Correcta**, sin errores de tipos. | Comprueba los cambios de búsqueda y barra de navegación móvil. |
| Compilación API | `npm --workspace=apps/api run build` | **Correcta**, TypeScript compilado y cliente copiado. | Confirma que las consultas agregadas y los cambios de telemetría compilan. |
| Regresión de conversaciones y propuestas | `tests/conversations-and-proposals.test.ts` (Vitest) | **22 pruebas correctas.** | Cubre el flujo de conversaciones/propuestas tras sustituir conteos N+1 por agregación. |
| Analítica administrativa/telemetría | `tests/admin-analytics.test.ts` (Vitest) | **8 pruebas correctas.** | Verifica que los cambios en telemetría y analítica no rompen su comportamiento existente. |
| Ejecución conjunta API | Ambas suites anteriores en una ejecución de Vitest | **30 pruebas correctas en 2 archivos.** Duración observada: 7.39 s en este entorno local; no es una medición de capacidad de producción. | Reconfirma los resultados en el estado actual. |
| Whitespace de archivos de rendimiento | `git diff --check` sobre los cinco archivos de código cambiados, con rutas entrecomilladas | **Correcta**, sin errores de whitespace en el alcance revisado. | Se corrigió el comando de shell inicial, que no interpretó una ruta con paréntesis; el reintento citado terminó correctamente. |

Las ejecuciones individuales anteriores de las suites API dieron los mismos resultados: 22 y 8 pruebas, respectivamente. El intento inicial de comprobación de whitespace no pudo ejecutarse por el parseo de PowerShell de una ruta con paréntesis; se repitió con la ruta entrecomillada y pasó. En esta revisión, iniciar Expo desde la raíz seleccionó el entrypoint equivocado (`Unable to resolve "../../App"`); reiniciarlo desde `apps/mobile` resolvió el problema. El primer intento web con token simulado recibió 401 del API real y no permitió validar el retorno; se repitió con respuestas API simuladas. Estos intentos fallidos no son fallos de la aplicación.

## Mejoras implementadas asociadas a esta evaluación

- Inicio móvil: filtra las publicaciones localmente mientras se escribe, separa carga inicial de filtros y descarta respuestas obsoletas; elimina peticiones repetidas por tecla y la carga duplicada.
- API de publicaciones: elimina la escritura global de expiración en cada búsqueda; la consulta filtra las publicaciones vencidas.
- Conversaciones: reemplaza conteos por conversación por agregaciones SQL, tanto en el listado como en el total no leído.
- Telemetría: reduce la limpieza de sesiones a una vez por minuto y reemplaza el desplazamiento del arreglo de solicitudes por un buffer circular.
- Navegación móvil: evita sondeos de no leídos cuando la pantalla no está enfocada y evita peticiones simultáneas; la prueba de UI valida retorno seguro e Inicio.
- Panel administrador: la flecha de regreso ahora reemplaza la pantalla por el perfil y un botón explícito «Perfil» ofrece el mismo retorno; se oculta «Inicio» en el panel para que no apunte al propio panel.
- Analítica circular: añade gráficos para los cinco sectores con más operaciones y categorías de material con mayor volumen ofrecido/recuperado. Se cargan al entrar a Indicadores, se actualizan con «Refrescar» y muestran errores o estados sin actividad en lugar de datos sintéticos.
- Diseño: la prueba automatizada valida el contraste de los colores corporativos y el texto de los controles enumerados en la tabla.

## Validación realizada

- `npx tsc --noEmit -p apps/mobile/tsconfig.json`: correcto.
- `npm --workspace=apps/api run build`: correcto.
- `npm --workspace=apps/api run test -- tests/conversations-and-proposals.test.ts`: 22 pruebas correctas.
- `npm --workspace=apps/api run test -- tests/admin-analytics.test.ts`: 8 pruebas correctas.

Estas pruebas verifican tipos, regresiones funcionales y consultas con los datos del conjunto de pruebas; **no equivalen a una prueba de carga**. No se midieron solicitudes por segundo, latencias P95/P99, memoria, consumo de batería ni FPS en dispositivos físicos. No afirmar que la aplicación soporta una concurrencia específica hasta ejecutar una prueba de carga representativa.

El error web reportado `Failed to execute 'removeChild' on 'Node'` no se reprodujo al probar los dos retornos del panel ni el ciclo perfil → panel → perfil con Expo Web. Esta prueba de navegación no demuestra que el error no pueda ocurrir bajo otras condiciones; si persiste, registrar la primera excepción de consola anterior a `ErrorToast` para identificar su origen.

El mapa global de actividad para administradores se evaluó como viabilidad en [viabilidad-mapa-actividad-admin.md](./viabilidad-mapa-actividad-admin.md), pero no está implementado; por tanto, no hay pruebas funcionales ni de rendimiento del mapa o una medición en Android para registrar.

## Riesgos pendientes antes de alto tráfico

- **Prueba de carga de extremo a extremo:** definir concurrencia y mezcla de rutas reales; ejecutar contra infraestructura de staging representativa. Medir P50/P95/P99, errores, CPU/RAM, pool/espera PostgreSQL y consultas lentas; probar picos y soak prolongado. Repetir navegación, búsqueda, inicio de sesión y chat en Android real de gama media.
- **Almacenamiento distribuido:** telemetría y sesiones analíticas viven en memoria de cada proceso. Los limitadores de registro/login usan el almacenamiento en memoria por defecto de `express-rate-limit`. Con varias réplicas estos valores se dividen por instancia y se pierden al reiniciar; para métricas consistentes y límites compartidos se necesita un almacén central (por ejemplo Redis) o telemetría externa.
- **Pool de conexiones:** dimensionar conexiones de Prisma/PostgreSQL por máximo de réplicas, workers y conexiones disponibles en el proveedor. Evaluar pooling externo (PgBouncer o equivalente) según el despliegue; no fijar `connection_limit` sin conocer ese presupuesto.
- **Consultas y datos de crecimiento:** verificar índices con `EXPLAIN (ANALYZE, BUFFERS)` sobre datos representativos, especialmente búsqueda de publicaciones, feeds y conversaciones. Algunas analíticas administrativas todavía materializan registros de tablas completas en la aplicación; migrarlas a agregaciones SQL/materializadas o un almacén analítico cuando el volumen lo justifique.
- **Transferencia e imágenes:** evaluar compresión HTTP y ETags para JSON, y almacenar/servir fotografías desde almacenamiento de objetos/CDN con tamaños adaptativos; evitar cargar originales en listas móviles.
- **Actualización de chat:** el badge aún consulta cada 15 segundos mientras el usuario mantiene una vista enfocada. A alto número de sesiones, evaluar push/WebSocket administrado o sondeo adaptativo con backoff y ciclo de vida de app en segundo plano.

## Criterios de aceptación sugeridos para el ensayo de carga

Fijar primero el volumen esperado de usuarios simultáneos y la capacidad del entorno. Como puerta inicial de staging, acordar objetivos explícitos para P95 de lecturas y escrituras, tasa de errores, uso de CPU/memoria y saturación de conexiones; mantener el ensayo por al menos 30 minutos y validar un pico superior al volumen previsto. Los valores finales deben reflejar el SLA y presupuesto reales, no tomarse de esta revisión estática.
