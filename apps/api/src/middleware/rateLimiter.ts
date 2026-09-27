import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/apiResponse';
import { env } from '../config/env';

/**
 * Limitador de intentos para inicio de sesión (Login):
 * Máximo 10 intentos por cada ventana de 15 minutos por dirección IP.
 * En ambiente de testing se omite para no interferir con las pruebas automatizadas.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: env.NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'TOO_MANY_REQUESTS',
      'Has superado el límite de intentos de inicio de sesión. Por favor intenta de nuevo en 15 minutos.',
      429
    );
  },
});

/**
 * Limitador de intentos para registro de cuentas:
 * Máximo 20 registros por hora por dirección IP.
 */
export const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: env.NODE_ENV === 'test' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      'TOO_MANY_REQUESTS',
      'Límite de solicitudes de registro excedido. Intenta más tarde.',
      429
    );
  },
});
