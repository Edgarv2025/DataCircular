import { PrismaClient } from '../generated/prisma-client';

declare global {
  // Evitar múltiples instancias de Prisma Client en desarrollo con recarga en caliente
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma = global.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

/**
 * Verifica la conectividad real con la base de datos PostgreSQL
 * mediante una consulta liviana (SELECT 1).
 * Retorna latencia en milisegundos y estado.
 */
export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  latencyMs: number;
  error?: string;
}> {
  const start = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Math.round(performance.now() - start);
    return {
      connected: true,
      latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : 'Error desconocido al conectar a la BD';
    return {
      connected: false,
      latencyMs,
      error: message,
    };
  }
}
