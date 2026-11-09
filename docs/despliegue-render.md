# Staging gratuito en Render

El archivo `render.yaml` declara el API y PostgreSQL de DATA_CIRCULAR en el plan gratuito, en la región Ohio. El servicio se llama `data-circular-api-staging`; no es configuración de producción.

## Antes de crear servicios

1. Revisa y sube a una rama de GitHub los archivos de configuración de Render, la página de política y los cambios API requeridos. No subas archivos `.env`, credenciales de pruebas ni secretos.
2. Lee el borrador público de `/politica-datos`. Completa la identidad legal y el contacto oficial de la Fundación IMARA y solicita revisión/aprobación jurídica antes de registrar usuarios reales.
3. Ten presente que el servicio web gratuito se duerme tras 15 minutos sin tráfico. La base gratuita tiene 1 GB, no incluye backups y vence a los 30 días; Render puede eliminarla después del período de gracia si no se actualiza. No uses esta base para datos reales.

## Crear el Blueprint

1. Inicia sesión en Render y elige **New → Blueprint**.
2. Conecta el repositorio GitHub `Edgarv2025/DataCircular` y selecciona la rama que contiene `render.yaml`.
3. Revisa que el web service y PostgreSQL indiquen el plan **Free** antes de aplicar el Blueprint. No confirmes si aparece un recurso pago.
4. El servicio ejecuta `prisma migrate deploy` antes de iniciar la API. Revisa el log de deploy y confirma el estado `healthy` en `/api/v1/health`.
5. Render asigna una URL `onrender.com`. La API deriva de esa URL la política pública `/politica-datos` y permite ese mismo origen en CORS.

No se habilitan despliegues automáticos por cada commit (`autoDeployTrigger: off`). La URL pública no debe configurarse en EAS ni usarse para producción hasta que la política haya sido aprobada, las pruebas en staging estén completas y se haya elegido un hosting/base de datos adecuados para producción.
