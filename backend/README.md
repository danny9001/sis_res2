# Backend - Sistema de Reservas

API REST construida con Node.js, Express, TypeScript y Prisma.

## 📁 Estructura

```
backend/
├── src/
│   ├── modules/        # Módulos funcionales
│   │   ├── auth/       # Autenticación
│   │   ├── users/      # Gestión de usuarios
│   │   ├── sectors/    # Gestión de sectores
│   │   ├── events/     # Gestión de eventos
│   │   ├── reservations/ # Gestión de reservas
│   │   ├── approvals/  # Sistema de aprobaciones
│   │   ├── invitations/ # Gestión de invitados y QR
│   │   ├── analytics/  # Estadísticas y reportes
│   │   └── audit/      # Auditoría del sistema
│   ├── middleware/     # Middlewares personalizados
│   ├── utils/          # Utilidades y helpers
│   └── server.ts       # Punto de entrada
├── prisma/
│   ├── schema.prisma   # Schema de la base de datos
│   └── seed.ts         # Datos iniciales
└── tests/              # Tests unitarios e integración
```

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Poblar base de datos
npx prisma db seed

# Iniciar en desarrollo
npm run dev
```

## 📡 API Endpoints

### Autenticación
- POST `/api/auth/login` - Iniciar sesión
- POST `/api/auth/register` - Registrar usuario
- POST `/api/auth/refresh` - Refrescar token

### Usuarios
- GET `/api/users` - Listar usuarios
- GET `/api/users/:id` - Obtener usuario
- POST `/api/users` - Crear usuario
- PUT `/api/users/:id` - Actualizar usuario
- DELETE `/api/users/:id` - Desactivar usuario

### Sectores
- GET `/api/sectors` - Listar sectores
- POST `/api/sectors` - Crear sector
- PUT `/api/sectors/:id` - Actualizar sector

### Eventos
- GET `/api/events` - Listar eventos
- GET `/api/events/:id` - Obtener evento
- POST `/api/events` - Crear evento
- PUT `/api/events/:id` - Actualizar evento

### Reservas
- GET `/api/reservations` - Listar reservas
- GET `/api/reservations/:id` - Obtener reserva
- POST `/api/reservations` - Crear reserva
- PUT `/api/reservations/:id` - Actualizar reserva
- DELETE `/api/reservations/:id` - Cancelar reserva

### Aprobaciones
- GET `/api/approvals/pending` - Listar pendientes
- POST `/api/approvals/:id/approve` - Aprobar reserva
- POST `/api/approvals/:id/reject` - Rechazar reserva

### Invitados
- POST `/api/guests/validate` - Validar QR
- GET `/api/guests/frequent` - Invitados frecuentes

### Analíticas
- GET `/api/analytics/dashboard` - Estadísticas generales
- GET `/api/analytics/relator/:id` - Estadísticas de relacionador

### Auditoría
- GET `/api/audit` - Logs de auditoría
- GET `/api/audit/reservation/:id` - Historial de reserva

## 🔒 Autenticación

Todas las rutas (excepto `/auth/*`) requieren autenticación mediante JWT:

```
Authorization: Bearer <token>
```

## 🎭 Roles

- **ADMIN**: Acceso completo al sistema
- **APPROVER**: Puede aprobar/rechazar reservas de sus sectores
- **RELATOR**: Puede crear y ver sus propias reservas

## 📊 Base de Datos

El sistema utiliza PostgreSQL con Prisma ORM. Schema principal:

- Users
- Sectors
- SectorApprovers
- Events
- EventSectors
- Reservations
- Guests
- Approvals
- AuditLogs

## 📧 Emails

El sistema envía emails automáticamente para:
- Notificaciones de aprobación
- Envío de QR codes
- Confirmaciones de reserva

Configuración en `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion
```

## 🔌 WebSockets

Socket.io para notificaciones en tiempo real:
- `new-approval-request` - Nueva solicitud de aprobación
- `reservation-approved` - Reserva aprobada
- `reservation-rejected` - Reserva rechazada

## 🧪 Testing

```bash
npm run test          # Ejecutar tests
npm run test:watch    # Modo watch
```

## 📝 Scripts

```bash
npm run dev           # Desarrollo
npm run build         # Compilar TypeScript
npm start             # Producción
npm run prisma:studio # UI de base de datos
npm run prisma:migrate # Crear migración
npm run prisma:seed   # Poblar base de datos
```

## 🐛 Debug

Para ver logs detallados:
```bash
DEBUG=* npm run dev
```
