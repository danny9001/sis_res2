# 📖 Guía de Instalación Detallada

Esta guía te llevará paso a paso para instalar y configurar el Sistema de Reservas.

## 📋 Requisitos del Sistema

### Software Necesario

1. **Node.js 18+**
   ```bash
   # Verificar versión
   node --version
   ```
   Descargar desde: https://nodejs.org/

2. **PostgreSQL 14+**
   ```bash
   # Verificar versión
   psql --version
   ```
   Descargar desde: https://www.postgresql.org/download/

3. **Git**
   ```bash
   # Verificar versión
   git --version
   ```
   Descargar desde: https://git-scm.com/downloads

4. **npm o yarn**
   ```bash
   # Verificar versión
   npm --version
   ```

## 🚀 Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone https://github.com/danny9001/sis_res2.git
cd sis_res2
```

### 2. Configurar la Base de Datos

#### Crear la Base de Datos

```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE sistema_reservas;

# Crear usuario (opcional)
CREATE USER reservas_user WITH ENCRYPTED PASSWORD 'tu_password_segura';
GRANT ALL PRIVILEGES ON DATABASE sistema_reservas TO reservas_user;

# Salir
\q
```

### 3. Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

#### Configurar Variables de Entorno (.env)

```env
# Database
DATABASE_URL="postgresql://usuario:password@localhost:5432/sistema_reservas?schema=public"

# JWT
JWT_SECRET="tu-secret-key-super-segura-cambiame-123456789"
JWT_REFRESH_SECRET="tu-refresh-secret-key-super-segura-cambiame-987654321"
JWT_EXPIRES_IN="24h"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="tu-email@gmail.com"
SMTP_PASS="tu-password-de-aplicacion"
EMAIL_FROM="Sistema Reservas <noreply@sistema.com>"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR="./uploads"
```

#### Configurar Email (Gmail)

1. Ir a https://myaccount.google.com/apppasswords
2. Crear una contraseña de aplicación
3. Usar esa contraseña en `SMTP_PASS`

### 4. Ejecutar Migraciones

```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev --name init

# Poblar base de datos con datos iniciales
npx prisma db seed
```

### 5. Iniciar el Backend

```bash
# Modo desarrollo
npm run dev

# El servidor estará corriendo en http://localhost:3001
```

### 6. Configurar el Frontend

Abrir una nueva terminal:

```bash
cd ../frontend

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Editar .env
nano .env
```

#### Configurar Variables de Entorno del Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
```

### 7. Iniciar el Frontend

```bash
npm run dev

# La aplicación estará corriendo en http://localhost:3000
```

## ✅ Verificar la Instalación

1. **Abrir navegador**: http://localhost:3000
2. **Iniciar sesión** con las credenciales por defecto:
   - **Admin**: admin@sistema.com / Admin123!
   - **Aprobador**: aprobador1@sistema.com / Aprobador123!
   - **Relacionador**: relacionador1@sistema.com / Relacionador123!

## 🔧 Solución de Problemas

### Error de Conexión a la Base de Datos

```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Reiniciar PostgreSQL
sudo systemctl restart postgresql

# Verificar conexión
psql -U postgres -d sistema_reservas
```

### Error de Instalación de Dependencias

```bash
# Limpiar cache de npm
npm cache clean --force

# Eliminar node_modules
rm -rf node_modules package-lock.json

# Reinstalar
npm install
```

### Puerto ya en uso

```bash
# Backend (3001)
lsof -ti:3001 | xargs kill -9

# Frontend (3000)
lsof -ti:3000 | xargs kill -9
```

### Error en Prisma

```bash
# Resetear base de datos (CUIDADO: Elimina todos los datos)
npx prisma migrate reset

# Volver a generar cliente
npx prisma generate
```

## 📊 Uso de Prisma Studio (Opcional)

Para explorar y editar la base de datos visualmente:

```bash
cd backend
npx prisma studio

# Se abrirá en http://localhost:5555
```

## 🐳 Instalación con Docker (Alternativa)

Si prefieres usar Docker:

```bash
# En la raíz del proyecto
docker-compose up -d

# Ejecutar migraciones
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npx prisma db seed
```

## 📦 Scripts Útiles

### Backend

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start

# Migraciones
npm run prisma:migrate
npm run prisma:generate
npm run prisma:seed

# Prisma Studio
npm run prisma:studio
```

### Frontend

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm run preview

# Lint
npm run lint

# Format
npm run format
```

## 🌐 Despliegue en Producción

### Backend (Railway/Render/Heroku)

1. Crear proyecto en la plataforma
2. Conectar repositorio de GitHub
3. Configurar variables de entorno
4. La plataforma ejecutará automáticamente:
   ```bash
   npm install
   npx prisma generate
   npx prisma migrate deploy
   npm run build
   npm start
   ```

### Frontend (Vercel/Netlify)

1. Conectar repositorio
2. Configurar:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables: `REACT_APP_API_URL`

### Base de Datos (Supabase/Railway)

1. Crear base de datos PostgreSQL
2. Obtener connection string
3. Actualizar `DATABASE_URL` en variables de entorno

## 📱 Próximos Pasos

1. Personalizar los sectores según tu evento
2. Crear usuarios relacionadores y aprobadores
3. Configurar el diseño de sectores
4. Crear tu primer evento
5. Probar el flujo completo de reserva

## 🆘 Soporte

- 📧 Email: soporte@sistema.com
- 🐛 Issues: https://github.com/danny9001/sis_res2/issues
- 📖 Docs: https://github.com/danny9001/sis_res2/wiki

---

¡Felicitaciones! Tu sistema de reservas está listo para usar. 🎉
