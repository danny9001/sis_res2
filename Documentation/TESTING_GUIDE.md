# 🧪 Guía de Testing - Sistema de Reservas

## Índice
1. [Configuración Inicial](#configuración-inicial)
2. [Testing de Nuevas Funcionalidades](#testing-de-nuevas-funcionalidades)
3. [Testing de Seguridad](#testing-de-seguridad)
4. [Testing de Performance](#testing-de-performance)
5. [Checklist de Testing](#checklist-de-testing)

---

## Configuración Inicial

### 1. Configurar Variables de Entorno

#### Backend (`backend/.env`)
```bash
# Copiar el archivo de ejemplo
cp backend/.env.example backend/.env

# Editar y configurar las variables REQUERIDAS
# Asegúrate de cambiar:
# - JWT_SECRET (mínimo 32 caracteres)
# - JWT_REFRESH_SECRET (diferente al JWT_SECRET)
# - DATABASE_URL
# - Credenciales SMTP
```

**Generar secrets seguros:**
```bash
# Generar JWT_SECRET
openssl rand -base64 32

# Generar JWT_REFRESH_SECRET
openssl rand -base64 32
```

#### Frontend (`frontend/.env`)
```bash
cp frontend/.env.example frontend/.env
# Verificar que VITE_API_URL apunte al backend correcto
```

### 2. Verificar Instalación
```bash
# Backend
cd backend
npm install
npm run prisma:generate
npm run prisma:migrate

# Frontend
cd frontend
npm install
```

---

## Testing de Nuevas Funcionalidades

### ✅ 1. Validación de Variables de Entorno

**Objetivo**: Verificar que el sistema valida variables faltantes al iniciar.

**Pasos**:
1. Renombra temporalmente tu `.env`: `mv backend/.env backend/.env.backup`
2. Intenta iniciar el servidor: `npm run dev`
3. **Resultado esperado**: Error claro indicando variables faltantes

**Ejemplo de salida esperada**:
```
❌ Faltan las siguientes variables de entorno requeridas:
  - DATABASE_URL
  - JWT_SECRET
  - JWT_REFRESH_SECRET
  ...
```

4. Restaura el archivo: `mv backend/.env.backup backend/.env`

---

### ✅ 2. Rate Limiting

**Objetivo**: Verificar que el rate limiting protege endpoints críticos.

#### Test 1: Rate Limiting General
```bash
# Ejecutar 101 requests rápidas al endpoint health
for i in {1..101}; do
  curl -s http://localhost:3001/api/health
done
```

**Resultado esperado**: Las últimas requests deben recibir error 429:
```json
{
  "error": "Demasiadas peticiones desde esta IP, por favor intenta más tarde"
}
```

#### Test 2: Rate Limiting de Auth
```bash
# Intentar 6 logins fallidos consecutivos
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

**Resultado esperado**: Después del 5to intento, recibir error 429.

---

### ✅ 3. Refresh Token Automático

**Objetivo**: Verificar que el frontend refresca tokens expirados automáticamente.

**Pasos**:
1. Inicia sesión en la aplicación
2. Abre DevTools → Application → Local Storage
3. Anota el token actual
4. Modifica `JWT_EXPIRES_IN="5s"` en `.env` (solo para testing)
5. Reinicia el backend
6. Inicia sesión de nuevo
7. Espera 6 segundos
8. Realiza cualquier acción en la app (navegar, hacer una petición)

**Resultado esperado**:
- La petición NO falla
- En Network tab, verás un request a `/auth/refresh`
- El token en localStorage se actualiza automáticamente
- La operación continúa sin interrupciones

**IMPORTANTE**: Restaura `JWT_EXPIRES_IN="1h"` después del test.

---

### ✅ 4. Transacciones en Creación de Reservas

**Objetivo**: Verificar integridad de datos en operaciones complejas.

**Pasos**:
1. Crea una reserva que requiera aprobación
2. Verifica en la BD que se crearon todos los registros:

```sql
-- Verifica que existan:
SELECT * FROM reservations WHERE id = '<reservation_id>';
SELECT * FROM guests WHERE reservation_id = '<reservation_id>';
SELECT * FROM approvals WHERE reservation_id = '<reservation_id>';
SELECT * FROM audit_logs WHERE reservation_id = '<reservation_id>';
```

**Resultado esperado**: Todos los registros relacionados existen y son consistentes.

#### Test de Rollback (Simulación)
Para testing más avanzado, temporalmente modifica el código para forzar un error:

```typescript
// En reservations.controller.ts, dentro de la transacción
await tx.approval.create({ /* ... */ });

// Agregar esta línea SOLO PARA TESTING:
throw new Error('Test rollback');
```

**Resultado esperado**: La reserva NO se crea en la BD (rollback completo).

**IMPORTANTE**: Quita el `throw new Error` después del test.

---

### ✅ 5. Autenticación WebSocket

**Objetivo**: Verificar que WebSocket requiere autenticación.

#### Test 1: Conexión sin token (debe fallar)
```javascript
// En DevTools Console del frontend
const socket = io('http://localhost:3001');

socket.on('connect_error', (error) => {
  console.log('Error:', error.message);
  // Esperado: "No autorizado - Token requerido"
});
```

#### Test 2: Conexión con token válido (debe funcionar)
```javascript
const token = localStorage.getItem('token');
const socket = io('http://localhost:3001', {
  auth: { token }
});

socket.on('connect', () => {
  console.log('✅ Conectado con autenticación');
});
```

**Resultado esperado**: Solo la conexión con token válido debe ser exitosa.

---

### ✅ 6. Winston Logger

**Objetivo**: Verificar que los logs se registran correctamente.

**Pasos**:
1. Inicia el servidor
2. Verifica logs en consola con colores
3. Realiza alguna operación que genere error
4. En producción, verifica archivos de log:

```bash
ls -la backend/logs/
cat backend/logs/error.log
cat backend/logs/combined.log
```

**Resultado esperado**: Logs estructurados en formato JSON en archivos.

---

### ✅ 7. Manejo de Errores de Email

**Objetivo**: Verificar que errores de email no rompen el flujo principal.

**Pasos**:
1. Configura credenciales SMTP inválidas en `.env`:
```env
SMTP_USER="invalid@email.com"
SMTP_PASS="wrongpassword"
```

2. Crea una reserva que requiera aprobación
3. Verifica en logs el error de email
4. **Resultado esperado**:
   - La reserva SE CREA exitosamente
   - El log muestra el error de email
   - El sistema continúa funcionando

5. Restaura las credenciales correctas

---

### ✅ 8. Validación Zod en Endpoints

**Objetivo**: Verificar que datos inválidos son rechazados.

#### Test 1: Login con email inválido
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"not-an-email","password":"123456"}'
```

**Resultado esperado**:
```json
{
  "error": "Datos de entrada inválidos",
  "details": [
    {
      "field": "email",
      "message": "Email inválido"
    }
  ]
}
```

#### Test 2: Crear reserva sin invitados
```bash
curl -X POST http://localhost:3001/api/reservations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "uuid-here",
    "sectorId": "uuid-here",
    "guests": []
  }'
```

**Resultado esperado**:
```json
{
  "error": "Datos de entrada inválidos",
  "details": [
    {
      "field": "guests",
      "message": "Debe incluir al menos un invitado"
    }
  ]
}
```

---

## Testing de Seguridad

### 🔒 1. SQL Injection Protection
Prisma ORM protege automáticamente, pero verifica:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com OR 1=1--","password":"test"}'
```

**Resultado esperado**: Login falla sin comprometer la BD.

---

### 🔒 2. JWT Token Expiration
```bash
# Intenta usar un token expirado
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer <expired-token>"
```

**Resultado esperado**: Error 401 "Token inválido"

---

### 🔒 3. Role-Based Access Control
```bash
# Como RELATOR, intenta acceder a endpoint de ADMIN
curl -X GET http://localhost:3001/api/admin/users \
  -H "Authorization: Bearer <relator-token>"
```

**Resultado esperado**: Error 403 "No tienes permisos"

---

## Testing de Performance

### ⚡ 1. PrismaClient Singleton
**Objetivo**: Verificar que no hay múltiples conexiones activas.

```sql
-- En PostgreSQL, verifica conexiones activas
SELECT count(*) FROM pg_stat_activity WHERE datname = 'sistema_reservas';
```

**Resultado esperado**:
- Con singleton: 1-2 conexiones máximo
- Sin singleton (problema anterior): 10+ conexiones

---

### ⚡ 2. Carga de Múltiples Requests
```bash
# Instala Apache Bench
sudo apt-get install apache2-utils

# Test de carga: 100 requests, 10 concurrentes
ab -n 100 -c 10 http://localhost:3001/api/health
```

**Métricas esperadas**:
- Requests per second: >500
- Time per request: <20ms
- Failed requests: 0

---

## Checklist de Testing

### Pre-Deploy
- [ ] Todas las variables de entorno configuradas
- [ ] JWT secrets tienen mínimo 32 caracteres
- [ ] Credenciales SMTP funcionan
- [ ] Rate limiting responde con 429 después del límite
- [ ] Refresh token funciona automáticamente
- [ ] WebSocket requiere autenticación
- [ ] Logs se escriben correctamente
- [ ] Validación Zod rechaza datos inválidos
- [ ] Transacciones hacen rollback en errores

### Testing Manual en UI
- [ ] Login exitoso
- [ ] Logout exitoso
- [ ] Token se refresca automáticamente (esperar expiración)
- [ ] Crear reserva funciona
- [ ] Aprobar reserva funciona
- [ ] Rechazar reserva funciona
- [ ] Emails se envían correctamente
- [ ] Notificaciones WebSocket en tiempo real
- [ ] Rate limiting bloquea después de muchos requests
- [ ] Usuarios no autorizados no pueden acceder a rutas protegidas

### Testing de Seguridad
- [ ] SQL injection protegido
- [ ] XSS protegido (inputs sanitizados)
- [ ] CSRF tokens implementados (si aplica)
- [ ] Tokens JWT expiran correctamente
- [ ] Rate limiting previene brute force
- [ ] Roles y permisos funcionan correctamente
- [ ] WebSocket requiere autenticación
- [ ] Variables sensibles no expuestas en logs

---

## Herramientas Recomendadas

### Testing Automatizado (Futuro)
- **Jest**: Unit tests
- **Supertest**: API endpoint tests
- **Playwright**: E2E tests

### Monitoreo
- **Winston**: Logging estructurado ✅ (ya implementado)
- **PM2**: Process management
- **New Relic / DataDog**: APM

### Seguridad
- **Helmet**: Security headers ✅ (ya implementado)
- **Rate-limit**: DDoS protection ✅ (ya implementado)
- **OWASP ZAP**: Security scanning
- **npm audit**: Dependency vulnerabilities

---

## Comandos Útiles

```bash
# Verificar logs del backend
tail -f backend/logs/combined.log

# Verificar conexiones a PostgreSQL
psql -U postgres -d sistema_reservas -c "SELECT * FROM pg_stat_activity;"

# Monitorear requests en tiempo real
# (requiere pm2)
pm2 logs backend --lines 50

# Verificar vulnerabilidades
cd backend && npm audit
cd frontend && npm audit

# Limpiar y reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

---

## Troubleshooting

### Problema: "Faltan variables de entorno"
**Solución**: Verifica que tu `.env` tenga TODAS las variables marcadas como REQUERIDAS en `.env.example`

### Problema: Rate limiting bloqueando requests normales
**Solución**: Incrementa límites en `backend/src/middleware/rateLimiter.ts`

### Problema: Refresh token no funciona
**Solución**: Verifica que `JWT_REFRESH_SECRET` esté configurado y sea diferente de `JWT_SECRET`

### Problema: WebSocket no conecta
**Solución**: Verifica que el token se envíe en `auth: { token }` al conectar

### Problema: Emails no se envían
**Solución**:
1. Verifica credenciales SMTP
2. Para Gmail, usa contraseñas de aplicación, no tu contraseña real
3. Revisa logs en `backend/logs/error.log`

---

## 📝 Notas Finales

- Ejecuta estos tests en un ambiente de desarrollo/staging, NUNCA en producción
- Documenta cualquier bug encontrado en GitHub Issues
- Actualiza esta guía si encuentras nuevos casos de test

**Happy Testing! 🚀**
