import { z } from 'zod';

const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().optional(), // Optional when auth is disabled
  NEXTAUTH_URL: z.string().url().optional(),
  EMAIL_SERVER_HOST: z.string().optional(), // Optional when auth is disabled
  EMAIL_SERVER_PORT: z.coerce.number().positive().optional(),
  EMAIL_SERVER_USER: z.string().optional(), // Optional when auth is disabled
  EMAIL_SERVER_PASSWORD: z.string().optional(), // Optional when auth is disabled
  EMAIL_FROM: z.string().optional(), // Optional when auth is disabled
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(), // Optional when auth is disabled
  NEON_POOLER_URL: z.string().url().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

const serverEnv = serverSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  EMAIL_SERVER_HOST: process.env.EMAIL_SERVER_HOST,
  EMAIL_SERVER_PORT: process.env.EMAIL_SERVER_PORT,
  EMAIL_SERVER_USER: process.env.EMAIL_SERVER_USER,
  EMAIL_SERVER_PASSWORD: process.env.EMAIL_SERVER_PASSWORD,
  EMAIL_FROM: process.env.EMAIL_FROM,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  CRON_SECRET: process.env.CRON_SECRET,
  NEON_POOLER_URL: process.env.NEON_POOLER_URL,
});

const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

export const env = {
  ...serverEnv,
  ...clientEnv,
};
