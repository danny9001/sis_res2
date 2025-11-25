# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [1.1.0] - 2025-01-21

### 🔴 Crítico - REQUIERE ACCIÓN

#### Fixed
- **[BREAKING]** Corregido typo en `frontend/src/contexts/AuthContext.tsx` - `AuthContextContextType` → `AuthContextType`
- **[BREAKING]** Implementado PrismaClient singleton compartido para prevenir agotamiento de conexiones a BD
  - Nuevo archivo: `backend/src/utils/prisma.ts`
  - Actualizado: Todos los controladores (9 archivos)
- **[BREAKING]** Agregada verificación de variables de entorno críticas al inicio del servidor
  - Nuevo archivo: `backend/src/utils/env.ts`
  - El servidor NO iniciará si faltan variables requeridas
  - `JWT_REFRESH_SECRET` ahora es **REQUERIDO**

### 🟠 Seguridad

#### Added
- **Rate Limiting** implementado en endpoints
  - Nuevo archivo: `backend/src/middleware/rateLimiter.ts`
  - Rate limiter general: 100 req/15min
  - Rate limiter de auth: 5 intentos/15min
  - Rate limiter de creación: 10 ops/min
  - Rate limiter sensible: 20 ops/min

- **Validación de entrada con Zod** en todos los endpoints
  - Nuevo archivo: `backend/src/middleware/validation.ts`
  - 12+ esquemas de validación
  - Protección contra inyección de datos maliciosos

- **Autenticación JWT en WebSocket**
  - WebSocket ahora requiere token válido para conectar
  - Actualizado: `backend/src/server.ts:49-80`

- **Transacciones en operaciones críticas**
  - Creación de reservas ahora usa `prisma.$transaction()`
  - Rollback automático en caso de error
  - Actualizado: `backend/src/modules/reservations/reservations.controller.ts:200-295`

#### Changed
- JWT token expiration reducido de 24h a 1h (más seguro)
- Todos los secrets deben tener mínimo 32 caracteres (advertencia en logs)

### 🟡 Mejoras de Código

#### Added
- **Winston Logger estructurado**
  - Nuevo archivo: `backend/src/utils/logger.ts`
  - Logs a archivo en producción (`logs/error.log`, `logs/combined.log`)
  - Logs coloreados en desarrollo
  - Integrado con Morgan para request logging

- **Refresh Token automático en frontend**
  - Actualizado: `frontend/src/services/api.ts`
  - Interceptor de Axios que refresca tokens expirados
  - Cola de peticiones fallidas
  - Mejor UX: usuarios no son expulsados abruptamente

- **Tipos TypeScript específicos**
  - Nuevo archivo: `backend/src/types/index.ts`
  - Eliminados tipos `any` en archivos críticos
  - Interfaces para: `JwtPayload`, `ReservationWhereInput`, `ApprovalWhereInput`, `GuestCreateInput`, etc.

#### Changed
- **Manejo de errores mejorado en emailService**
  - Try-catch en todas las funciones de email
  - Logging estructurado de errores
  - Errores de email no rompen flujo principal
  - Actualizado: `backend/src/utils/emailService.ts`

- **Error handler mejorado**
  - Usa winston logger en lugar de console.error
  - Logging contextual (URL, método, IP, user agent)
  - Stack traces solo en desarrollo
  - Actualizado: `backend/src/middleware/errorHandler.ts`

### 📚 Documentación

#### Added
- `Documentation/TESTING_GUIDE.md` - Guía completa de testing
- `Documentation/MIGRATION_GUIDE.md` - Guía de migración v1.0 → v1.1
- `CHANGELOG.md` - Este archivo
- `.env.example` actualizado con comentarios detallados (backend y frontend)

### 🔧 Archivos Nuevos

```
backend/src/middleware/rateLimiter.ts    # Rate limiting
backend/src/middleware/validation.ts     # Validación Zod
backend/src/types/index.ts               # Tipos TypeScript
backend/src/utils/env.ts                 # Validación de env vars
backend/src/utils/logger.ts              # Winston logger
backend/src/utils/prisma.ts              # Singleton de PrismaClient
Documentation/TESTING_GUIDE.md           # Guía de testing
Documentation/MIGRATION_GUIDE.md         # Guía de migración
CHANGELOG.md                             # Este archivo
```

### 📊 Estadísticas

- **21 archivos modificados**
- **637 líneas agregadas**
- **137 líneas eliminadas**
- **6 archivos nuevos creados**

### ⚠️ Breaking Changes

1. **JWT_REFRESH_SECRET requerido**: El servidor no iniciará sin esta variable
2. **WebSocket requiere autenticación**: Conexiones sin token serán rechazadas
3. **JWT expira en 1h**: Cambio de 24h a 1h (configurable)
4. **Variables de entorno validadas**: El servidor no iniciará si faltan variables críticas

### 🔄 Migración

Ver `Documentation/MIGRATION_GUIDE.md` para instrucciones detalladas.

**Pasos principales**:
1. Agregar `JWT_REFRESH_SECRET` al `.env`
2. Actualizar código: `git pull`
3. Reinstalar dependencias: `npm install`
4. Verificar variables: Todas las marcadas como REQUERIDAS en `.env.example`
5. Reiniciar servidor

### 🧪 Testing

Ver `Documentation/TESTING_GUIDE.md` para casos de test completos.

**Tests críticos**:
- Rate limiting funciona
- Refresh token automático
- Transacciones en BD
- Autenticación WebSocket
- Validación Zod

---

## [1.0.0] - 2025-01-15

### Added
- Sistema completo de reservas para eventos
- Autenticación con JWT
- 3 roles de usuario: ADMIN, APPROVER, RELATOR
- Sistema de aprobaciones multinivel
- Generación de códigos QR para invitados
- Envío de emails con QR codes
- Dashboard con analytics
- Audit trail completo
- WebSocket para notificaciones en tiempo real
- Frontend React con TypeScript
- Backend Node.js/Express con Prisma ORM
- Base de datos PostgreSQL

### Features Principales
- **Auth**: Login/Logout con JWT
- **Reservas**: CRUD completo con validaciones
- **Aprobaciones**: Flujo de aprobación por sectores
- **Invitados**: Gestión con QR codes únicos
- **Eventos**: Gestión de eventos y sectores
- **Analytics**: Dashboard con métricas
- **Audit**: Registro de todas las acciones
- **Notificaciones**: WebSocket en tiempo real
- **Email**: Envío automático de confirmaciones

---

## Formato

### Tipos de cambios
- `Added` - Nuevas funcionalidades
- `Changed` - Cambios en funcionalidades existentes
- `Deprecated` - Funcionalidades que se eliminarán pronto
- `Removed` - Funcionalidades eliminadas
- `Fixed` - Corrección de bugs
- `Security` - Mejoras de seguridad

### Niveles de severidad
- 🔴 **Crítico** - Requiere acción inmediata, puede romper funcionalidad
- 🟠 **Alto** - Importante, debe atenderse pronto
- 🟡 **Medio** - Mejora recomendada
- 🔵 **Bajo** - Mejora opcional
- ⚪ **Info** - Cambio informativo sin impacto

[1.1.0]: https://github.com/tuusuario/sis_res2/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/tuusuario/sis_res2/releases/tag/v1.0.0
