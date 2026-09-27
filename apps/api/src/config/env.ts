import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Cargar variables de entorno desde .env si existe
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerida'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET debe tener al menos 16 caracteres').default('default_dev_secret_change_me_12345'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(16).default('default_dev_refresh_secret_12345'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  CORS_ORIGIN: z.string().default('*'),
  DATA_POLICY_URL: z.string().default('https://fundacionimara.org/politica-datos-pendiente'),
  DATA_POLICY_VERSION: z.string().default('1.0-draft'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Error de validación en variables de entorno:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
