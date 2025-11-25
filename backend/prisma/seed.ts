import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear usuarios
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const approverPassword = await bcrypt.hash('Aprobador123!', 10);
  const relatorPassword = await bcrypt.hash('Relator123!', 10);
  const validatorPassword = await bcrypt.hash('Validador123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
      email: 'admin@sistema.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
    },
  });

  const approver = await prisma.user.upsert({
    where: { email: 'aprobador@sistema.com' },
    update: {},
    create: {
      email: 'aprobador@sistema.com',
      password: approverPassword,
      name: 'Aprobador',
      role: 'APPROVER',
    },
  });

  const relator = await prisma.user.upsert({
    where: { email: 'relator@sistema.com' },
    update: {},
    create: {
      email: 'relator@sistema.com',
      password: relatorPassword,
      name: 'Relacionador',
      role: 'RELATOR',
    },
  });

  const validator = await prisma.user.upsert({
    where: { email: 'validador@sistema.com' },
    update: {},
    create: {
      email: 'validador@sistema.com',
      password: validatorPassword,
      name: 'Validador',
      role: 'VALIDATOR',
    },
  });

  console.log('✅ Usuarios creados');

  // Crear sectores
  const vipSector = await prisma.sector.upsert({
    where: { code: 'VIP' },
    update: {},
    create: {
      name: 'VIP',
      code: 'VIP',
      description: 'Sector VIP',
      capacity: 100,
      requiresApproval: true,
      color: '#FFD700',
    },
  });

  const generalSector = await prisma.sector.upsert({
    where: { code: 'GENERAL' },
    update: {},
    create: {
      name: 'General',
      code: 'GENERAL',
      description: 'Sector General',
      capacity: 500,
      requiresApproval: false,
      color: '#3B82F6',
    },
  });

  console.log('✅ Sectores creados');

  // Crear configuración del sitio
  const settings = await prisma.siteSettings.upsert({
    where: { id: '1' },
    update: {},
    create: {
      id: '1',
      siteName: 'Sistema de Reservas',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      maxGuestsPerTable: 15,
      requireApproval: true,
    },
  });

  console.log('✅ Configuración creada');

  console.log('');
  console.log('🎉 Seed completado!');
  console.log('');
  console.log('👤 Usuarios creados:');
  console.log('   Admin:      admin@sistema.com / Admin123!');
  console.log('   Aprobador:  aprobador@sistema.com / Aprobador123!');
  console.log('   Relator:    relator@sistema.com / Relator123!');
  console.log('   Validador:  validador@sistema.com / Validador123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
SEED_FILE