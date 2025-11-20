# 🎉 Sistema de Reservas para Eventos

Sistema completo de gestión de reservas para eventos con aprobaciones multinivel, generación de QR, y auditoría completa.

## 🚀 Características Principales

- **Gestión de Sectores**: Administración de sectores VIP y generales con layout gráfico
- **Aprobaciones Multinivel**: Sistema de aprobación por sectores con notificaciones en tiempo real
- **Generación de QR**: Códigos QR únicos por invitado enviados automáticamente
- **Sistema de Auditoría**: Log completo de todas las acciones del sistema
- **Dashboard Analytics**: Métricas y estadísticas en tiempo real
- **Gestión de Invitados**: Base de datos de invitados frecuentes
- **Multi-rol**: Admin, Aprobador, Relacionador con permisos específicos

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn
- Git

## 🛠️ Instalación Rápida

```bash
# Clonar el repositorio
git clone https://github.com/danny9001/sis_res2.git
cd sis_res2

# Instalar dependencias del backend
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Ejecutar migraciones
npx prisma migrate dev
npx prisma db seed

# Iniciar backend
npm run dev

# En otra terminal, instalar frontend
cd ../frontend
npm install

# Configurar variables de entorno del frontend
cp .env.example .env

# Iniciar frontend
npm run dev
```

## 📖 Documentación

Ver [INSTALLATION.md](./INSTALLATION.md) para guía detallada de instalación.

## 🏗️ Stack Tecnológico

### Backend
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT + Socket.io
- Nodemailer + QRCode

### Frontend
- React 18 + TypeScript
- TailwindCSS
- React Query + Context API
- React Router v6

## 🔐 Usuarios por Defecto

```
Admin: admin@sistema.com / Admin123!
Aprobador: aprobador@sistema.com / Aprobador123!
Relacionador: relacionador@sistema.com / Relacionador123!
```

## 📝 Licencia

MIT License

---

⭐ Dale una estrella si te resulta útil!
