/**
 * Banderas de Funcionalidades (Feature Flags) - DATA_CIRCULAR
 * Permiten aislar módulos que aún no cuentan con backend (Fases 10 en adelante)
 * usando datos de muestra en /mocks. Cambiar cualquier bandera a 'false' conecta
 * inmediatamente el cliente al endpoint real sin modificar las pantallas.
 */
export const FeatureFlags = {
  USE_MOCKS_CHAT: true,
  USE_MOCKS_PROPOSALS: true,
  USE_MOCKS_OPERATIONS: true,
  USE_MOCKS_ADMIN_MODERATION: true,
};
