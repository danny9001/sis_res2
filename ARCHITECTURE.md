# 🏗️ Arquitectura del Sistema

## Visión General

El Sistema de Reservas está construido con una arquitectura moderna de tres capas:

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND                       │
│         React + TypeScript + TailwindCSS        │
│                (Port 3000)                      │
└──────────────────┬──────────────────────────────┘
                   │ HTTP/REST + WebSockets
┌──────────────────▼──────────────────────────────┐
│                  BACKEND                        │
│      Node.js + Express + TypeScript + Prisma    │
│                (Port 3001)                      │
└──────────────────┬──────────────────────────────┘
                   │ Prisma ORM
┌──────────────────▼──────────────────────────────┐
│               BASE DE DATOS                     │
│              PostgreSQL 14+                     │
│                (Port 5432)                      │
└─────────────────────────────────────────────────┘
```

## 🎯 Patrones de Diseño

### Backend

#### 1. Arquitectura en Capas (Layered Architecture)

```
Controller → Service → Repository → Database
```

- **Controllers**: Manejan requests HTTP, validación de entrada
- **Services**: Lógica de negocio
- **Repository (Prisma)**: Acceso a datos
- **Database**: PostgreSQL

#### 2. Módulos

Cada funcionalidad está encapsulada en un módulo:

```
module/
├── controller.ts    # Maneja HTTP
├── service.ts       # Lógica de negocio
├── routes.ts        # Define rutas
├── types.ts         # TypeScript types
└── validation.ts    # Validaciones
```

#### 3. Middleware Pattern

```typescript
Request → authenticate → authorize → controller → response
```

Middlewares aplicados:
- `authenticate`: Verifica JWT
- `authorize`: Verifica permisos por rol
- `errorHandler`: Manejo centralizado de errores
- `rateLimiter`: Protección contra abuso

### Frontend

#### 1. Composición de Componentes

```
Pages → Components → Hooks → Services
```

- **Pages**: Vistas completas
- **Components**: Componentes reutilizables
- **Hooks**: Lógica compartida
- **Services**: Comunicación con API

#### 2. Estado Global

```
Context API + React Query
```

- **AuthContext**: Estado de autenticación
- **React Query**: Cache de datos del servidor
- **Local State**: useState para estado local

#### 3. Routing

```
React Router v6 con rutas protegidas por rol
```

## 📊 Base de Datos

### Modelo de Datos

```
User ──┬─── createdReservations (Reservation)
       ├─── saleReservations (Reservation)
       ├─── approvedReservations (Approval)
       ├─── sectorApprovers (SectorApprover)
       └─── auditLogs (AuditLog)

Sector ──┬─── reservations (Reservation)
         ├─── approvers (SectorApprover)
         └─── eventSectors (EventSector)

Event ──┬─── reservations (Reservation)
        └─── eventSectors (EventSector)

Reservation ──┬─── guests (Guest)
              ├─── approval (Approval)
              └─── auditLogs (AuditLog)
```

### Relaciones Clave

1. **Usuario → Reserva**: Muchos a muchos
   - Como relacionador principal
   - Como relacionador de venta

2. **Sector → Aprobador**: Muchos a muchos
   - Un sector puede tener múltiples aprobadores
   - Un aprobador puede manejar múltiples sectores

3. **Reserva → Invitados**: Uno a muchos
   - Una reserva tiene múltiples invitados
   - Cada invitado tiene un QR único

4. **Reserva → Aprobación**: Uno a uno
   - Solo reservas de sectores VIP requieren aprobación

## 🔐 Seguridad

### Autenticación

```typescript
POST /auth/login
  ↓
JWT Token + Refresh Token
  ↓
localStorage
  ↓
Authorization: Bearer <token>
```

### Autorización

```typescript
Role-Based Access Control (RBAC)

ADMIN    → Acceso completo
APPROVER → Aprobaciones + Lectura
RELATOR  → CRUD de sus reservas
```

### Protecciones

- ✅ JWT con expiración
- ✅ Refresh tokens
- ✅ Bcrypt para passwords (10 rounds)
- ✅ Rate limiting
- ✅ CORS configurado
- ✅ Helmet.js
- ✅ Input sanitization
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection

## 📨 Sistema de Notificaciones

### Email (Nodemailer)

```typescript
Eventos que disparan emails:
1. Solicitud de aprobación → Aprobador
2. Reserva aprobada → Relacionador (con QRs)
3. Reserva rechazada → Relacionador (con motivo)
```

### WebSockets (Socket.io)

```typescript
Eventos en tiempo real:
- new-approval-request
- reservation-approved
- reservation-rejected
- guest-validated
```

## 🔄 Flujo de Datos

### Crear Reserva

```
1. Relacionador llena formulario
   ↓
2. POST /api/reservations
   ↓
3. Validar evento y sector
   ↓
4. Crear reserva + invitados + QRs
   ↓
5. Si sector VIP:
   - Crear aprobación
   - Email a aprobador
   - WebSocket notification
   ↓
6. Si sector normal:
   - Auto-aprobar
   - Generar y enviar QRs
```

### Aprobar Reserva

```
1. Aprobador ve solicitud
   ↓
2. POST /api/approvals/:id/approve
   ↓
3. Actualizar estado
   ↓
4. Generar QRs únicos
   ↓
5. Enviar email con QRs
   ↓
6. WebSocket notification
   ↓
7. Auditoría log
```

### Validar QR en Evento

```
1. Scanear QR
   ↓
2. POST /api/guests/validate
   ↓
3. Verificar validez
   ↓
4. Verificar no usado previamente
   ↓
5. Marcar como validado
   ↓
6. Registrar en auditoría
```

## 📈 Escalabilidad

### Optimizaciones Actuales

1. **React Query**: Cache inteligente
2. **Prisma**: Queries optimizadas
3. **Indexes**: En campos frecuentes
4. **Paginación**: En listas grandes
5. **Lazy Loading**: Componentes pesados

### Mejoras Futuras

1. **Redis**: Cache de sesiones
2. **CDN**: Assets estáticos
3. **Load Balancer**: Múltiples instancias
4. **Database Replicas**: Read replicas
5. **Message Queue**: Para emails

## 🧪 Testing

### Backend
```
Unit Tests → Integration Tests → E2E Tests
   Jest         Supertest        Playwright
```

### Frontend
```
Unit Tests → Integration Tests → E2E Tests
  Vitest     React Testing Lib    Cypress
```

## 📦 Deployment

### Development
```
localhost:3000 (Frontend)
localhost:3001 (Backend)
localhost:5432 (PostgreSQL)
```

### Production
```
Vercel/Netlify     → Frontend
Railway/Render     → Backend
Supabase/Railway   → Database
```

## 🔍 Monitoreo

### Logs
- Winston para logs estructurados
- Morgan para HTTP logs
- Auditoría completa en base de datos

### Métricas
- Performance de APIs
- Tasas de error
- Uso de recursos
- Actividad de usuarios

## 🚀 CI/CD

```
Git Push
  ↓
GitHub Actions
  ↓
├─ Lint & Format
├─ Run Tests
├─ Build
└─ Deploy
  ↓
Production
```

---

## 📚 Recursos Adicionales

- [Prisma Docs](https://www.prisma.io/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Socket.io Docs](https://socket.io/docs/v4/)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
