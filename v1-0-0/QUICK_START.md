# 🚀 Inicio Rápido - 5 Minutos

Esta guía te ayudará a tener el sistema funcionando en 5 minutos.

## ⚡ Instalación Express

### 1. Prerequisitos (2 min)

```bash
# Verificar Node.js
node --version  # Debe ser 18+

# Verificar PostgreSQL
psql --version  # Debe ser 14+
```

Si no los tienes:
- Node.js: https://nodejs.org/
- PostgreSQL: https://www.postgresql.org/download/

### 2. Clonar y Configurar (1 min)

```bash
# Clonar
git clone https://github.com/danny9001/sis_res2.git
cd sis_res2

# Backend
cd backend
npm install
cp .env.example .env
```

### 3. Configurar .env (30 seg)

Edita `backend/.env`:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/sistema_reservas"
JWT_SECRET="cambiar-por-secret-seguro-123456789"
JWT_REFRESH_SECRET="cambiar-por-refresh-secret-987654321"
```

### 4. Base de Datos (1 min)

```bash
# Crear base de datos
psql -U postgres -c "CREATE DATABASE sistema_reservas;"

# Migrar y poblar
npx prisma migrate dev
npx prisma db seed
```

### 5. Iniciar (30 seg)

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

## ✅ ¡Listo!

Abre http://localhost:3000

**Credenciales de prueba:**
- Admin: `admin@sistema.com` / `Admin123!`
- Aprobador: `aprobador1@sistema.com` / `Aprobador123!`
- Relacionador: `relacionador1@sistema.com` / `Relacionador123!`

## 🎯 Primeros Pasos

1. Inicia sesión como Admin
2. Ve a "Eventos" y explora el evento de ejemplo
3. Cambia a cuenta de Relacionador
4. Crea una nueva reserva
5. Cambia a cuenta de Aprobador
6. Aprueba la reserva

## 🐛 Problemas Comunes

### Puerto en uso
```bash
# Backend (3001)
lsof -ti:3001 | xargs kill -9

# Frontend (3000)
lsof -ti:3000 | xargs kill -9
```

### Error de Prisma
```bash
cd backend
npx prisma generate
npx prisma migrate reset
```

### Error de dependencias
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📚 Siguiente

- Lee [INSTALLATION.md](./INSTALLATION.md) para setup completo
- Lee [ARCHITECTURE.md](./ARCHITECTURE.md) para entender el sistema
- Revisa [backend/README.md](./backend/README.md) para API docs
- Revisa [frontend/README.md](./frontend/README.md) para componentes

## 💡 Tips

- Usa `npx prisma studio` para ver la base de datos visualmente
- Los emails se mostrarán en consola si no configuras SMTP
- Los logs de backend muestran todas las operaciones
- React Query Dev Tools están disponibles en desarrollo

## 🆘 Ayuda

¿Problemas? Abre un issue:
https://github.com/danny9001/sis_res2/issues

---

¡Disfruta del sistema! 🎊
