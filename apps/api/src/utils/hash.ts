import argon2 from 'argon2';

/**
 * DATA_CIRCULAR - Utilidad de Hashing Seguro con Argon2id
 * Parámetros alineados con las recomendaciones de seguridad OWASP:
 * - Tipo: Argon2id (híbrido resistente a ataques por canal lateral y GPU/ASIC)
 * - memoryCost: 65536 KiB (64 MiB)
 * - timeCost: 3 iteraciones
 * - parallelism: 4 hilos de ejecución
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verifica una contraseña en texto plano contra su hash almacenado.
 * Retorna false de forma segura si la verificación falla o si el hash es corrupto.
 */
export async function verifyPassword(hashedPassword: string, plainPassword: string): Promise<boolean> {
  try {
    return await argon2.verify(hashedPassword, plainPassword);
  } catch (err: unknown) {
    console.error('[Argon2 Verify Error]:', err instanceof Error ? err.message : 'Error desconocido');
    return false;
  }
}
