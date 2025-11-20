import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear usuarios
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const approverPassword = await bcrypt.hash('Aprobador123!', 10);
  const relatorPassword = await bcrypt.hash('Relacionador123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sistema.com' },
    update: {},
    create: {
      email: 'admin@sistema.com',
      password: adminPassword,
      name: 'Administrador Principal',
      phone: '+591 70000000',
      role: 'ADMIN'
    }
  });

  const approver1 = await prisma.user.upsert({
    where: { email: 'aprobador1@sistema.com' },
    update: {},
    create: {
      email: 'aprobador1@sistema.com',
      password: approverPassword,
      name: 'Juan Pérez - Aprobador VIP',
      phone: '+591 70000001',
      role: 'APPROVER'
    }
  });

  const approver2 = await prisma.user.upsert({
    where: { email: 'aprobador2@sistema.com' },
    update: {},
    create: {
      email: 'aprobador2@sistema.com',
      password: approverPassword,
      name: 'María García - Aprobador Lounge',
      phone: '+591 70000002',
      role: 'APPROVER'
    }
  });

  const relator1 = await prisma.user.upsert({
    where: { email: 'relacionador1@sistema.com' },
    update: {},
    create: {
      email: 'relacionador1@sistema.com',
      password: relatorPassword,
      name: 'Carlos López - Relacionador',
      phone: '+591 70000003',
      role: 'RELATOR'
    }
  });

  const relator2 = await prisma.user.upsert({
    where: { email: 'relacionador2@sistema.com' },
    update: {},
    create: {
      email: 'relacionador2@sistema.com',
      password: relatorPassword,
      name: 'Ana Martínez - Relacionador',
      phone: '+591 70000004',
      role: 'RELATOR'
    }
  });

  console.log('✅ Usuarios creados');

  // Crear sectores
  const sectorCamel = await prisma.sector.upsert({
    where: { code: 'J18' },
    update: {},
    create: {
      name: 'Camel',
      code: 'J18',
      description: 'Sector VIP Camel',
      capacity: 20,
      requiresApproval: true,
      isVIP: true
    }
  });

  const sectorGolden = await prisma.sector.upsert({
    where: { code: 'J25' },
    update: {},
    create: {
      name: 'Golden',
      code: 'J25',
      description: 'Sector VIP Golden',
      capacity: 15,
      requiresApproval: true,
      isVIP: true
    }
  });

  const sectorGeneral = await prisma.sector.upsert({
    where: { code: 'E18' },
    update: {},
    create: {
      name: 'General',
      code: 'E18',
      description: 'Sector General',
      capacity: 50,
      requiresApproval: false,
      isVIP: false
    }
  });

  const sectorParrales = await prisma.sector.upsert({
    where: { code: 'E23' },
    update: {},
    create: {
      name: 'Parrales',
      code: 'E23',
      description: 'Sector Parrales',
      capacity: 30,
      requiresApproval: false,
      isVIP: false
    }
  });

  const sectorLounge = await prisma.sector.upsert({
    where: { code: 'E23-L' },
    update: {},
    create: {
      name: 'Lounge',
      code: 'E23-L',
      description: 'Sector Lounge VIP',
      capacity: 25,
      requiresApproval: true,
      isVIP: true
    }
  });

  const sectorDigestan = await prisma.sector.upsert({
    where: { code: 'T24' },
    update: {},
    create: {
      name: 'Digestan',
      code: 'T24',
      description: 'Sector Digestan VIP',
      capacity: 20,
      requiresApproval: true,
      isVIP: true
    }
  });

  const sectorMambo = await prisma.sector.upsert({
    where: { code: 'T35' },
    update: {},
    create: {
      name: 'Mambo',
      code: 'T35',
      description: 'Sector Mambo VIP',
      capacity: 18,
      requiresApproval: true,
      isVIP: true
    }
  });

  console.log('✅ Sectores creados');

  // Asignar aprobadores a sectores VIP
  await prisma.sectorApprover.upsert({
    where: {
      sectorId_approverId: {
        sectorId: sectorCamel.id,
        approverId: approver1.id
      }
    },
    update: {},
    create: {
      sectorId: sectorCamel.id,
      approverId: approver1.id
    }
  });

  await prisma.sectorApprover.upsert({
    where: {
      sectorId_approverId: {
        sectorId: sectorGolden.id,
        approverId: approver1.id
      }
    },
    update: {},
    create: {
      sectorId: sectorGolden.id,
      approverId: approver1.id
    }
  });

  await prisma.sectorApprover.upsert({
    where: {
      sectorId_approverId: {
        sectorId: sectorLounge.id,
        approverId: approver2.id
      }
    },
    update: {},
    create: {
      sectorId: sectorLounge.id,
      approverId: approver2.id
    }
  });

  await prisma.sectorApprover.upsert({
    where: {
      sectorId_approverId: {
        sectorId: sectorMambo.id,
        approverId: approver1.id
      }
    },
    update: {},
    create: {
      sectorId: sectorMambo.id,
      approverId: approver1.id
    }
  });

  console.log('✅ Aprobadores asignados a sectores');

  // Crear evento de ejemplo
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const event = await prisma.event.create({
    data: {
      name: 'Gran Fiesta de Año Nuevo',
      eventDate: nextWeek,
      description: 'Celebración especial de fin de año',
      eventSectors: {
        create: [
          { sectorId: sectorCamel.id, availableTables: 10 },
          { sectorId: sectorGolden.id, availableTables: 8 },
          { sectorId: sectorGeneral.id, availableTables: 25 },
          { sectorId: sectorParrales.id, availableTables: 15 },
          { sectorId: sectorLounge.id, availableTables: 12 },
          { sectorId: sectorDigestan.id, availableTables: 10 },
          { sectorId: sectorMambo.id, availableTables: 9 }
        ]
      }
    }
  });

  console.log('✅ Evento de ejemplo creado');

  console.log('\n🎉 Seed completado exitosamente!\n');
  console.log('📧 Credenciales de acceso:');
  console.log('----------------------------');
  console.log('Admin: admin@sistema.com / Admin123!');
  console.log('Aprobador 1: aprobador1@sistema.com / Aprobador123!');
  console.log('Aprobador 2: aprobador2@sistema.com / Aprobador123!');
  console.log('Relacionador 1: relacionador1@sistema.com / Relacionador123!');
  console.log('Relacionador 2: relacionador2@sistema.com / Relacionador123!');
  console.log('----------------------------\n');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
