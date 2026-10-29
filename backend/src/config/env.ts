import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  DB_HOST: z.string().min(1, 'DB_HOST es obligatorio'),
  DB_PORT: z.string().regex(/^\d+$/, 'DB_PORT debe ser numérico').default('5432'),
  DB_NAME: z.string().min(1, 'DB_NAME es obligatorio'),
  DB_USER: z.string().min(1, 'DB_USER es obligatorio'),
  DB_PASSWORD: z.string().min(1, 'DB_PASSWORD es obligatorio'),
  DB_SCHEMA: z.string().min(1, 'DB_SCHEMA es obligatorio').default('contrataciones01'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_ACCESS_TOKEN_EXPIRES_MINUTES: z.string().default('15'),
  JWT_REFRESH_TOKEN_EXPIRES_DAYS: z.string().default('7'),

  BCRYPT_SALT_ROUNDS: z.string().default('12'),
  MAX_LOGIN_ATTEMPTS: z.string().default('5'),
  LOCK_MINUTES: z.string().default('15'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('═══════════════════════════════════════════════════════════');
  console.error('❌ ERROR EN VARIABLES DE ENTORNO (.env)');
  console.error('═══════════════════════════════════════════════════════════');
  for (const issue of parsed.error.issues) {
    console.error(`   • ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('───────────────────────────────────────────────────────────');
  console.error('   Copie .env.example a .env y complete los valores.');
  console.error('═══════════════════════════════════════════════════════════');
  process.exit(1);
}

export const env = {
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  db: {
    host: parsed.data.DB_HOST,
    port: parseInt(parsed.data.DB_PORT, 10),
    name: parsed.data.DB_NAME,
    user: parsed.data.DB_USER,
    password: parsed.data.DB_PASSWORD,
    schema: parsed.data.DB_SCHEMA,
  },
  jwt: {
    secret: parsed.data.JWT_SECRET,
    accessTokenExpiresMinutes: parseInt(parsed.data.JWT_ACCESS_TOKEN_EXPIRES_MINUTES, 10),
    refreshTokenExpiresDays: parseInt(parsed.data.JWT_REFRESH_TOKEN_EXPIRES_DAYS, 10),
  },
  security: {
    bcryptSaltRounds: parseInt(parsed.data.BCRYPT_SALT_ROUNDS, 10),
    maxLoginAttempts: parseInt(parsed.data.MAX_LOGIN_ATTEMPTS, 10),
    lockMinutes: parseInt(parsed.data.LOCK_MINUTES, 10),
  },
  corsOrigin: parsed.data.CORS_ORIGIN,
};