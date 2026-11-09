import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Cargar variables de entorno desde .env si existe
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const defaultJwtSecret = 'default_dev_secret_change_me_12345';
const defaultJwtRefreshSecret = 'default_dev_refresh_secret_12345';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres').default(defaultJwtSecret),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(16).default(defaultJwtRefreshSecret),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  CORS_ORIGIN: z.preprocess(
    (value) => value === undefined && process.env.RENDER_EXTERNAL_URL
      ? process.env.RENDER_EXTERNAL_URL
      : value,
    z.string().default('*')
  ),
  DATA_POLICY_URL: z.preprocess(
    (value) => {
      if (
        value === undefined ||
        value === '' ||
        value === 'https://fundacionimara.org/politica-datos-pendiente'
      ) {
        const externalUrl = process.env.RENDER_EXTERNAL_URL;
        return externalUrl ? `${externalUrl.replace(/\/$/, '')}/politica-datos` : undefined;
      }
      return value;
    },
    z.string().url('DATA_POLICY_URL debe ser una URL válida').optional()
  ),
  DATA_POLICY_VERSION: z.preprocess(
    (value) => value === '1.0-draft' ? undefined : value,
    z.string().min(1).default('pendiente')
  ),
}).superRefine((config, context) => {
  if (config.NODE_ENV !== 'production') return;

  if (config.JWT_SECRET === defaultJwtSecret) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_SECRET'],
      message: 'JWT_SECRET debe configurarse con un secreto propio en producción',
    });
  } else if (Buffer.byteLength(config.JWT_SECRET, 'utf8') < 32) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_SECRET'],
      message: 'JWT_SECRET debe tener al menos 32 bytes en producción',
    });
  }

  if (config.JWT_REFRESH_SECRET === defaultJwtRefreshSecret) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_REFRESH_SECRET'],
      message: 'JWT_REFRESH_SECRET debe configurarse con un secreto propio en producción',
    });
  } else if (Buffer.byteLength(config.JWT_REFRESH_SECRET, 'utf8') < 32) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_REFRESH_SECRET'],
      message: 'JWT_REFRESH_SECRET debe tener al menos 32 bytes en producción',
    });
  }

  if (config.JWT_SECRET === config.JWT_REFRESH_SECRET) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_REFRESH_SECRET'],
      message: 'JWT_REFRESH_SECRET debe ser distinto de JWT_SECRET',
    });
  }

  const corsOrigins = config.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  const hasInvalidCorsOrigin = corsOrigins.some((origin) => {
    if (!origin || origin === '*') return true;

    try {
      const parsedOrigin = new URL(origin);
      return (
        parsedOrigin.protocol !== 'https:' ||
        parsedOrigin.pathname !== '/' ||
        parsedOrigin.search.length > 0 ||
        parsedOrigin.hash.length > 0
      );
    } catch {
      return true;
    }
  });

  if (hasInvalidCorsOrigin) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CORS_ORIGIN'],
      message: 'CORS_ORIGIN debe contener únicamente orígenes HTTPS válidos y autorizados en producción',
    });
  }

  if (!config.DATA_POLICY_URL || !config.DATA_POLICY_URL.startsWith('https://')) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DATA_POLICY_URL'],
      message: 'DATA_POLICY_URL debe ser una URL HTTPS pública en producción',
    });
  }

  if (
    config.DATA_POLICY_VERSION.trim().toLowerCase() === 'pendiente' ||
    config.DATA_POLICY_VERSION.trim().toLowerCase().includes('draft')
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['DATA_POLICY_VERSION'],
      message: 'DATA_POLICY_VERSION debe identificar la versión publicada de la política',
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Error de validación en variables de entorno:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
