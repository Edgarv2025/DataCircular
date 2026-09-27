import { Request, Response } from 'express';
import { checkDatabaseConnection } from '../../database/prisma';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { HealthCheckData } from '@data-circular/shared';
import { env } from '../../config/env';

const startTime = Date.now();

export async function getHealthStatus(_req: Request, res: Response): Promise<Response> {
  const dbCheck = await checkDatabaseConnection();

  const healthData: HealthCheckData = {
    service: 'DATA_CIRCULAR API',
    version: '0.1.0',
    status: dbCheck.connected ? 'healthy' : 'degraded',
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    database: {
      status: dbCheck.connected ? 'connected' : 'error',
      latencyMs: dbCheck.latencyMs,
    },
    environment: env.NODE_ENV,
  };

  if (!dbCheck.connected) {
    return sendError(
      res,
      'DATABASE_UNAVAILABLE',
      'El servicio está degradado: no se pudo establecer conexión con la base de datos.',
      503,
      healthData
    );
  }

  return sendSuccess(res, healthData, 'Servicio y base de datos operativos');
}
