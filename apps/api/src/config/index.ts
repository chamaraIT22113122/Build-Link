import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Microsoft SQL Server 2025 Express configuration
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default('1433'),
  DB_USER: z.string().default('sa'),
  DB_PASSWORD: z.string().default('YourStrongPassword123!'),
  DB_NAME: z.string().default('BuildLinkDB'),
  DB_ENCRYPT: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
  DB_TRUST_SERVER_CERTIFICATE: z
    .string()
    .transform((val) => val === 'true')
    .default('true'),

  // Auth
  JWT_SECRET: z.string().default('default_jwt_secret_key_buildlink_32_chars_long'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // File Storage (local)
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./uploads'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
}

export const env = parsed.success ? parsed.data : envSchema.parse({});
