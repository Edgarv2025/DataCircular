# Viabilidad del mapa de actividad administrativa

**Revisión del código:** 2 de noviembre de 2026
**Resultado:** el mapa geográfico por jerarquías es factible, pero no está implementado. Como alternativa inmediata, el panel ya presenta gráficos de barras con los sectores más activos y el balance por categorías de material; no sustituyen el mapa por polígonos, los filtros geográficos ni el detalle por zona.

## Estado comprobado

- La app usa Expo Router y no incluye `react-native-maps`, `react-native-webview`, Leaflet, MapLibre ni archivos GeoJSON/TopoJSON de límites.
- El backend ya tiene rutas administrativas autenticadas y verifica `role === 'ADMIN'` en el servicio. `GET /admin/reports/localities` entrega agregados por nombre de localidad, no códigos geográficos.
- Las tablas actuales guardan localidad/ciudad como texto; no hay códigos ISO2/DANE que permitan el join requerido.
- No existe `GET /admin/analytics/map`, desglose por categoría/periodo, tendencia por zona ni enmascaramiento de usuarios con menos de tres miembros.
- Por tanto, no es posible medir todavía el rendimiento real en un Android de gama media. Cualquier cifra antes del prototipo y el dispositivo sería inventada.
- La pestaña de Indicadores de la app móvil carga bajo demanda los cinco municipios/localidades con más operaciones y los cinco materiales principales por movimiento. Compara kg ofrecidos en publicaciones con kg recuperados en operaciones cerradas. Esta alternativa usa los endpoints `/admin/reports/localities` y `/admin/reports/materials`; está probada visualmente en Web con respuestas simuladas, pero no se midió en un Android físico.

## Tecnología recomendada: WebView con Leaflet y GeoJSON

Para este caso se recomienda **(b)**, empaquetando Leaflet localmente en la app y manteniendo un solo WebView de mapa. Resuelve de forma directa los coropléticos por cuantiles, patrones para “sin actividad”, puntos proporcionales y estilos de selección. La vista de lista nativa permanece disponible aunque el WebView tarde en cargar o no pueda dibujar el mapa. Los límites de municipios se cargarían por departamento y se simplificarían antes de enviarlos al WebView.

| Opción | Ventajas | Costos/riesgos para este producto |
|---|---|---|
| (a) `react-native-maps` con polígonos | Gestos y controles nativos; buen punto de partida para Android/iOS. | Hay que convertir las geometrías y gestionar muchos vértices/objetos nativos. Los patrones tramados y la escala/leyenda requieren trabajo adicional; medir el puente nativo con los municipios cargados es obligatorio. |
| (b) WebView con Leaflet/GeoJSON | Manejo maduro de GeoJSON, coropletas, puntos, estilos y carga por nivel; los patrones y la leyenda se pueden renderizar en el propio mapa. | Una WebView añade memoria y puede bloquearse con demasiados vértices. Empaquetar recursos localmente, simplificar geometrías, cargar solo un departamento y medir en dispositivo real. |
| (c) `react-native-svg` con proyección propia | Control total y sin motor cartográfico externo. | Proyección, zoom, paneo, selección, geometrías, accesibilidad y rendimiento pasan a ser código propio; mayor costo y riesgo para esta jerarquía. |

La recomendación es condicional: construir primero un prototipo con Colombia y un departamento representativo, medirlo en el Android de gama media de aceptación y conservar la lista como alternativa obligatoria. Si la WebView incumple el presupuesto de memoria o fluidez, comparar el mismo conjunto simplificado con `react-native-maps` antes de comprometer la arquitectura.

## Datos y unión territorial

- Países: Natural Earth, dominio público; utilizar límites simplificados y registrar en el artefacto la escala, versión/fecha de descarga, URL y licencia.
- Colombia: Marco Geoestadístico Nacional (MGN) del DANE para departamentos y municipios. Registrar la edición/fecha de descarga, URL, metadatos de licencia y transformación aplicada. La edición concreta queda **pendiente de seleccionar y verificar**; no hay datos descargados en el repositorio.
- Relacionar siempre por ISO2 en países y por código oficial DANE en departamento/municipio. No convertir nombres actuales a códigos en tiempo de consulta. Los registros existentes solo tienen texto y necesitan un proceso controlado de normalización/migración.
- Mantener los límites simplificados fuera de las respuestas de métricas; cargar GeoJSON municipal a demanda por departamento y combinarlo con valores agregados mediante código.

## API, privacidad y visualización

Implementar el contrato solicitado `GET /admin/analytics/map?level=world|country|department&parent=&metric=&category=&from=&to=` bajo autenticación y autorización ADMIN **en servidor**. La lista/leyenda debe exponer `code`, `name`, `value`, `share` y `topCategories`; el panel de detalle también necesita oferta/necesidad, tendencia y conteo de usuarios activos. Enmascarar el conteo cuando sea menor que 3 y evitar devolver identificadores personales. Resolver empates de cuantiles determinísticamente y distinguir actividad cero de dato no disponible; “sin actividad” debe ser gris tramado.

La paleta será una escala secuencial verde de cinco cuantiles. Naranja corporativo `#FA6060` para zona seleccionada y zonas top-5; asegurar borde legible sobre las cinco clases. El mapa y la lista deben exponer las mismas zonas y selección, con navegación jerárquica y botón de regreso. La lista numerada no dependerá del mapa para mostrar o seleccionar datos.

## Medición pendiente y criterios propuestos

La medición se debe hacer en un Android de gama media identificado (modelo, RAM, versión de Android), con build de producción y datos de prueba documentados. Registrar tiempo hasta primer mapa interactivo, memoria pico, fluidez durante paneo/zoom, latencia de cambio de nivel y tiempo de carga municipal. Ejecutar el mismo escenario para WebView y, si no cumple, `react-native-maps`. No se reportan resultados hasta que exista ese prototipo y ese dispositivo.

Antes de publicar: probar permisos ADMIN/USER, códigos ISO2/DANE, filtros y cinco cuantiles, carga diferida, zonas sin actividad, umbral de privacidad `< 3`, igualdad de datos mapa/lista y navegación de los tres niveles.
