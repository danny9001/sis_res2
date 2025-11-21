import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  FRONTEND_URL: string;
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_SECURE: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  EMAIL_FROM: string;
}

const requiredEnvVars: (keyof EnvConfig)[] = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM'
];

export function validateEnv(): void {
  const missingVars: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }

  if (missingVars.length > 0) {
    throw new Error(
      `❌ Faltan las siguientes variables de entorno requeridas:\n${missingVars.map(v => `  - ${v}`).join('\n')}\n\nPor favor, configura estas variables en tu archivo .env`
    );
  }

  // Validaciones adicionales
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('⚠️  ADVERTENCIA: JWT_SECRET debería tener al menos 32 caracteres para mayor seguridad');
  }

  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    console.warn('⚠️  ADVERTENCIA: JWT_REFRESH_SECRET debería tener al menos 32 caracteres para mayor seguridad');
  }

  console.log('✅ Variables de entorno validadas correctamente');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || '3001',
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL!,
  smtp: {
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
  emailFrom: process.env.EMAIL_FROM!,
};
