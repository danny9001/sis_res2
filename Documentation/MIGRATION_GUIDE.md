# 🔄 Guía de Migración - v1.0.0 → v1.1.0

## Resumen de Cambios

Esta actualización incluye mejoras críticas de seguridad, performance y calidad de código.

### 🔴 Cambios Críticos (Acción Requerida)
- ✅ Variables de entorno validadas al inicio
- ✅ JWT_REFRESH_SECRET ahora es REQUERIDO
- ✅ PrismaClient usa patrón singleton

### 🟠 Nuevas Funcionalidades
- ✅ Rate limiting implementado
- ✅ Validación de entrada con Zod
- ✅ Transacciones en operaciones críticas
- ✅ Winston logger estructurado
- ✅ Refresh token automático en frontend
- ✅ Autenticación WebSocket
- ✅ Mejores tipos TypeScript

---

## 📋 Pasos de Migración

### Paso 1: Backup

**IMPORTANTE**: Antes de actualizar, haz backup de:

```bash
# Backup de base de datos
pg_dump -U postgres sistema_reservas > backup_$(date +%Y%m%d).sql

# Backup de archivos .env
cp backend/.env backend/.env.backup
cp frontend/.env frontend/.env.backup

# Backup de uploads (si existen)
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz backend/uploads/
```

---

### Paso 2: Actualizar Código

```bash
# Si usas Git
git pull origin main

# O descarga la nueva versión
```

---

### Paso 3: Actualizar Variables de Entorno

#### Backend `.env`

**NUEVAS VARIABLES REQUERIDAS:**

```bash
# Agregar JWT_REFRESH_SECRET (CRÍTICO)
JWT_REFRESH_SECRET="tu-refresh-secret-diferente-del-jwt-secret-MINIMO-32-CARACTERES"

# Opcional: Ajustar tiempos de expiración
JWT_EXPIRES_IN="1h"        # Antes era 24h
JWT_REFRESH_EXPIRES_IN="7d"
```

**Generar secrets seguros:**
```bash
# Para JWT_REFRESH_SECRET
openssl rand -base64 32
```

**VERIFICAR VARIABLES EXISTENTES:**
Asegúrate de que estas variables estén configuradas:
- `DATABASE_URL`
- `JWT_SECRET` (mínimo 32 caracteres)
- `JWT_REFRESH_SECRET` (NUEVO - diferente del JWT_SECRET)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`
- `FRONTEND_URL`

#### Frontend `.env`

No hay cambios críticos, pero verifica:
```bash
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

---

### Paso 4: Actualizar Dependencias

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
npm run prisma:generate

# Frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

---

### Paso 5: Ejecutar Migraciones (si hay cambios en BD)

```bash
cd backend
npm run prisma:migrate
```

**Nota**: Esta versión no incluye cambios en el schema, pero ejecuta el comando por seguridad.

---

### Paso 6: Verificar Instalación

```bash
# En backend/
npm run dev
```

**Deberías ver:**
```
✅ Variables de entorno validadas correctamente
🚀 Servidor corriendo en puerto 3001
📊 Environment: development
```

**Si ves errores de variables faltantes:**
```
❌ Faltan las siguientes variables de entorno requeridas:
  - JWT_REFRESH_SECRET
```
→ Vuelve al Paso 3 y agrega las variables faltantes.

---

### Paso 7: Testing Post-Migración

Ejecuta estos tests críticos:

#### Test 1: Verificar que el servidor inicia
```bash
curl http://localhost:3001/api/health
```
**Esperado**: `{"status":"ok","timestamp":"..."}`

#### Test 2: Login funciona
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}'
```
**Esperado**: Token JWT en la respuesta

#### Test 3: Rate limiting funciona
```bash
# Ejecutar 10 veces rápido
for i in {1..10}; do curl http://localhost:3001/api/health; done
```
**Esperado**: Todas las requests exitosas (están dentro del límite)

#### Test 4: WebSocket conecta
En el frontend, abre DevTools Console:
```javascript
const token = localStorage.getItem('token');
const socket = io('http://localhost:3001', { auth: { token } });
socket.on('connect', () => console.log('✅ WebSocket conectado'));
```

---

## 🔧 Cambios en el Código

### Si tienes código personalizado

#### 1. Importación de Prisma

**Antes:**
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

**Ahora:**
```typescript
import prisma from '../../utils/prisma';
// Ya no necesitas crear una nueva instancia
```

#### 2. Variables de Entorno

**Antes:**
```typescript
const jwtSecret = process.env.JWT_SECRET!;
```

**Ahora:**
```typescript
import { env } from './utils/env';
const jwtSecret = env.jwtSecret;
// Validado automáticamente al inicio
```

#### 3. Logging

**Antes:**
```typescript
console.log('Algo pasó');
console.error('Error:', error);
```

**Ahora:**
```typescript
import logger from './utils/logger';
logger.info('Algo pasó');
logger.error('Error:', { error, contexto: 'adicional' });
```

---

## 🚨 Breaking Changes

### 1. JWT_REFRESH_SECRET es REQUERIDO

**Impacto**: El servidor NO iniciará sin esta variable.

**Acción**: Agregar `JWT_REFRESH_SECRET` al archivo `.env`

### 2. Tiempos de expiración de JWT cambiaron

**Antes**:
- Token: 24h
- Refresh: 7d

**Ahora** (recomendado):
- Token: 1h
- Refresh: 7d

**Impacto**: Los usuarios necesitarán refrescar tokens más seguido, pero el sistema lo hace automáticamente.

**Acción**: Opcional - ajustar `JWT_EXPIRES_IN` en `.env` si prefieres tokens de mayor duración.

### 3. WebSocket requiere autenticación

**Antes**: Cualquiera podía conectarse.

**Ahora**: Se requiere token JWT válido.

**Impacto**: Conexiones WebSocket sin token serán rechazadas.

**Acción**: Actualizar código frontend que conecta al WebSocket:

```javascript
// Antes
const socket = io('http://localhost:3001');

// Ahora
const token = localStorage.getItem('token');
const socket = io('http://localhost:3001', {
  auth: { token }
});
```

---

## 🔄 Rollback Plan

Si algo sale mal, puedes revertir:

### Opción 1: Revertir Git
```bash
git reset --hard <commit-anterior>
```

### Opción 2: Restaurar Backup
```bash
# Restaurar base de datos
psql -U postgres sistema_reservas < backup_20250101.sql

# Restaurar .env
cp backend/.env.backup backend/.env
cp frontend/.env.backup frontend/.env

# Reinstalar versión anterior
npm install
```

---

## 📊 Verificación Final

### Checklist Post-Migración

- [ ] Servidor backend inicia sin errores
- [ ] Frontend inicia sin errores
- [ ] Login funciona correctamente
- [ ] Crear reserva funciona
- [ ] Aprobar/Rechazar reserva funciona
- [ ] Emails se envían correctamente
- [ ] WebSocket conecta y recibe notificaciones
- [ ] Logs aparecen en `backend/logs/` (en producción)
- [ ] Rate limiting bloquea después del límite
- [ ] No hay errores en la consola del navegador

---

## 🆘 Troubleshooting

### Error: "Faltan variables de entorno"
```
❌ Faltan las siguientes variables de entorno requeridas:
  - JWT_REFRESH_SECRET
```

**Solución**:
1. Verifica que tu `.env` tenga `JWT_REFRESH_SECRET`
2. Genera uno nuevo con: `openssl rand -base64 32`
3. Agrega al `.env`: `JWT_REFRESH_SECRET="<valor-generado>"`

---

### Error: "Cannot find module '../utils/prisma'"
**Causa**: Archivos de TypeScript no compilados.

**Solución**:
```bash
cd backend
npm run build
# O reinicia el servidor dev
npm run dev
```

---

### Error: WebSocket "No autorizado - Token requerido"
**Causa**: Frontend no envía token al conectar.

**Solución**: Actualiza el código de conexión WebSocket:
```javascript
const token = localStorage.getItem('token');
const socket = io(SOCKET_URL, { auth: { token } });
```

---

### Error: Rate limiting bloquea usuarios normales
**Causa**: Límites muy restrictivos.

**Solución**: Ajusta límites en `backend/src/middleware/rateLimiter.ts`:
```typescript
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200, // Incrementar de 100 a 200
  // ...
});
```

---

### Error: Tokens expirados muy rápido
**Causa**: `JWT_EXPIRES_IN` muy corto.

**Solución**: En `.env`, ajusta:
```bash
JWT_EXPIRES_IN="24h"  # En lugar de 1h
```

**Nota**: Tokens más largos son menos seguros pero más convenientes.

---

### Error: Múltiples conexiones a PostgreSQL
**Causa**: PrismaClient singleton no está funcionando.

**Solución**: Verifica que todos los imports usen:
```typescript
import prisma from '../../utils/prisma';
```

No debe haber `new PrismaClient()` en ningún lado excepto en `utils/prisma.ts`.

---

## 📞 Soporte

Si encuentras problemas no documentados aquí:

1. **Verifica logs**: `backend/logs/error.log`
2. **Revisa issues**: GitHub Issues del proyecto
3. **Compara con ejemplo**: Revisa `TESTING_GUIDE.md`

---

## 🎯 Próximos Pasos

Después de migrar exitosamente:

1. **Lee**: `TESTING_GUIDE.md` para probar todas las nuevas funcionalidades
2. **Configura**: Monitoreo en producción (PM2, logs, etc.)
3. **Considera**: Implementar tests automatizados (Jest, Supertest)
4. **Mejora**: Migrar de localStorage a httpOnly cookies (más seguro)

---

## 📝 Changelog Detallado

Ver archivo principal: `CHANGELOG.md`

### v1.1.0 (Fecha: YYYY-MM-DD)

#### 🔴 Crítico
- Implementado PrismaClient singleton (previene agotamiento de conexiones)
- Agregada validación de variables de entorno al inicio
- JWT_REFRESH_SECRET ahora es requerido

#### 🟠 Seguridad
- Implementado rate limiting en todos los endpoints
- Agregada validación de entrada con Zod
- Implementada autenticación en WebSocket
- Transacciones en operaciones críticas

#### 🟡 Mejoras
- Winston logger estructurado
- Refresh token automático en frontend
- Mejores tipos TypeScript (eliminados `any`)
- Manejo robusto de errores de email

---

**Versión**: v1.1.0
**Fecha**: 2025-01-21
**Tiempo estimado de migración**: 15-30 minutos
