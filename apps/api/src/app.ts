import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { v1Router } from './routes/v1.routes';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { env } from './config/env';

export function createApp(): Application {
  const app: Application = express();

  // Middleware de Seguridad HTTP Headers
  app.use(helmet());

  // Configuración de CORS
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Permitir solicitudes sin origen (como clientes móviles nativos o herramientas de testing)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origen ${origin} no permitido por política CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Parseo de cuerpo JSON y URL-encoded
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Rutas versionadas de la API
  app.use('/api/v1', v1Router);

  // Manejador de rutas no encontradas (404)
  app.use(notFoundHandler);

  // Manejador global de errores (500)
  app.use(errorHandler);

  return app;
}

export const app = createApp();
