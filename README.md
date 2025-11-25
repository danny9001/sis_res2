# 🎉 Sistema de Reservas para Eventos v2.1

Sistema completo de gestión de reservas para eventos con QR, aprobaciones multinivel, analíticas avanzadas y más.

![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 🆕 NOVEDADES EN v2.1

### ✨ Nuevos Módulos

1. **🎨 Personalización del Sitio**
   - Logo y favicon personalizables
   - Colores del tema
   - Configuración de contacto
   - Términos y condiciones

2. **👮 Rol Validador (Porteros)**
   - Escaneo de QR en la entrada
   - Vista de solo lectura de reservas
   - Estadísticas de validación
   - Búsqueda de invitados

3. **🎟️ Pases Adicionales**
   - Generar invitados extras para mesas
   - Validación de capacidad
   - QR únicos por pase
   - Estados: ACTIVE, USED, REVOKED

4. **📊 Analytics Avanzado**
   - Dashboard completo
   - Analíticas por evento/sector
   - Rendimiento de relacionadores
   - Ingresos detallados
   - Exportar a CSV

5. **🏢 Gestión de Sectores**
   - CRUD completo
   - Asignar aprobadores
   - Estadísticas por sector
   - Validación de capacidad

6. **🎉 Gestión de Eventos**
   - CRUD completo
   - Filtros avanzados
   - Capacidad máxima
   - Eventos activos/próximos

7. **👥 Gestión de Usuarios**
   - CRUD completo
   - 4 roles: ADMIN, APPROVER, RELATOR, VALIDATOR
   - Activar/desactivar
   - Búsqueda avanzada

8. **📋 Sistema de Auditoría**
   - Log de todas las acciones
   - Filtros avanzados
   - Estadísticas de uso
   - Historial por entidad

---

## 📋 CARACTERÍSTICAS PRINCIPALES

### ✅ Sistema Base
- 🔐 Autenticación JWT con refresh tokens
- 👥 Sistema de roles y permisos
- 📝 Gestión completa de reservas
- ✅ Aprobaciones multinivel
- 📧 Notificaciones por email
- 📱 Códigos QR únicos
- 🔍 Validación de QR en tiempo real
- 🌐 WebSockets para actualizaciones en vivo
- 📊 Dashboard de estadísticas
- 🗂️ Auditoría completa

### ✅ Módulos Avanzados (v2.1)
- 🎨 Personalización total del sitio
- 👮 Sistema de validadores
- 🎟️ Pases adicionales de emergencia
- 📊 Analíticas avanzadas
- 🏢 Gestión de sectores
- 🎉 Gestión de eventos
- 👥 Gestión de usuarios
- 📋 Auditoría detallada

---

## 🚀 INSTALACIÓN

### Requisitos Previos

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm >= 9.0.0

### 1. Clonar el Repositorio

```bash
git clone https://github.com/danny9001/sis_res2.git
cd sis_res2
```

### 2. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
nano .env
```

**Variables de entorno requeridas:**

```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/sistema_reservas"

# JWT
JWT_SECRET="tu-secreto-jwt-super-seguro"
JWT_REFRESH_SECRET="tu-secreto-refresh-super-seguro"

# Servidor
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu-email@gmail.com
EMAIL_PASSWORD=tu-password-app
EMAIL_FROM=noreply@sistema.com
```

### 3. Configurar Base de Datos

```bash
# Generar cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Poblar base de datos
npx prisma db seed
```

### 4. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
nano .env
```

**Variables de entorno del frontend:**

```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

### 5. Iniciar en Desarrollo

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Abrir http://localhost:3000

---

## 📦 ESTRUCTURA DEL PROYECTO

```
sis_res2/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/                    # Autenticación
│   │   │   ├── reservations/            # Reservas
│   │   │   ├── approvals/               # Aprobaciones
│   │   │   ├── notifications/           # Notificaciones
│   │   │   ├── qr/                      # Códigos QR
│   │   │   ├── settings/                # 🆕 Personalización
│   │   │   ├── validator/               # 🆕 Validadores
│   │   │   ├── additional-passes/       # 🆕 Pases adicionales
│   │   │   ├── analytics/               # 🆕 Analíticas
│   │   │   ├── sectors/                 # 🆕 Sectores
│   │   │   ├── events/                  # 🆕 Eventos
│   │   │   ├── users/                   # 🆕 Usuarios
│   │   │   └── audit/                   # 🆕 Auditoría
│   │   ├── middleware/                  # Middleware
│   │   ├── utils/                       # Utilidades
│   │   └── server.ts                    # Servidor principal
│   ├── prisma/
│   │   ├── schema.prisma                # Schema de BD
│   │   └── seed.ts                      # Datos iniciales
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── auth/                    # Login, registro
│   │   │   ├── dashboard/               # Dashboard
│   │   │   ├── reservations/            # Reservas
│   │   │   ├── approvals/               # Aprobaciones
│   │   │   ├── validator/               # 🆕 Validador QR
│   │   │   ├── settings/                # 🆕 Configuración
│   │   │   ├── analytics/               # 🆕 Analíticas
│   │   │   └── ...
│   │   ├── components/                  # Componentes
│   │   ├── services/                    # API services
│   │   ├── utils/                       # Utilidades
│   │   └── App.tsx
│   └── package.json
│
├── docs/                                # Documentación
│   ├── INSTALACION.md
│   ├── API.md
│   ├── MODULOS.md
│   └── TROUBLESHOOTING.md
│
└── README.md
```

---

## 🔐 ROLES Y PERMISOS

| Funcionalidad | ADMIN | APPROVER | RELATOR | VALIDATOR |
|--------------|-------|----------|---------|-----------|
| **Reservas** |
| Crear | ✅ | ✅ | ✅ | ❌ |
| Ver propias | ✅ | ✅ | ✅ | ❌ |
| Ver todas | ✅ | ✅ | ❌ | ❌ |
| Modificar | ✅ | ✅ | ✅* | ❌ |
| **Aprobaciones** |
| Aprobar | ✅ | ✅ | ❌ | ❌ |
| Rechazar | ✅ | ✅ | ❌ | ❌ |
| **Validación** |
| Escanear QR | ✅ | ❌ | ❌ | ✅ |
| Ver reservas | ✅ | ✅ | ✅ | ✅** |
| **Pases Adicionales** |
| Crear | ✅ | ✅ | ✅* | ❌ |
| Revocar | ✅ | ✅ | ❌ | ❌ |
| **Analytics** |
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Avanzado | ✅ | ✅ | ❌ | ❌ |
| **Gestión** |
| Sectores | ✅ | ❌ | ❌ | ❌ |
| Eventos | ✅ | ❌ | ❌ | ❌ |
| Usuarios | ✅ | ❌ | ❌ | ❌ |
| **Auditoría** |
| Ver logs | ✅ | ✅ | ❌ | ❌ |
| **Personalización** |
| Configurar | ✅ | ❌ | ❌ | ❌ |

*Solo sus propias reservas  
**Solo lectura

---

## 📡 API ENDPOINTS

### Autenticación
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/auth/me
```

### Reservas
```
GET    /api/reservations
POST   /api/reservations
GET    /api/reservations/:id
PUT    /api/reservations/:id
DELETE /api/reservations/:id
POST   /api/reservations/:id/guests
```

### Aprobaciones
```
GET    /api/approvals
POST   /api/approvals/:id/approve
POST   /api/approvals/:id/reject
```

### 🆕 Settings (Personalización)
```
GET    /api/settings/public
GET    /api/settings
PUT    /api/settings
POST   /api/settings/logo
POST   /api/settings/favicon
DELETE /api/settings/logo
```

### 🆕 Validator (Porteros)
```
POST   /api/validator/scan
GET    /api/validator/stats
GET    /api/validator/reservations
GET    /api/validator/reservation/:id
GET    /api/validator/search/:query
```

### 🆕 Additional Passes (Pases)
```
POST   /api/additional-passes
GET    /api/additional-passes
GET    /api/additional-passes/:id
GET    /api/additional-passes/:id/qr
POST   /api/additional-passes/:id/revoke
GET    /api/additional-passes/reservation/:id
GET    /api/additional-passes/stats/overview
```

### 🆕 Analytics
```
GET    /api/analytics/dashboard
GET    /api/analytics/events
GET    /api/analytics/relators
GET    /api/analytics/sectors
GET    /api/analytics/revenue
GET    /api/analytics/export
```

### 🆕 Sectors
```
GET    /api/sectors
POST   /api/sectors
GET    /api/sectors/:id
PUT    /api/sectors/:id
DELETE /api/sectors/:id
POST   /api/sectors/:id/approvers
DELETE /api/sectors/:id/approvers/:userId
GET    /api/sectors/:id/stats
```

### 🆕 Events
```
GET    /api/events
POST   /api/events
GET    /api/events/:id
PUT    /api/events/:id
DELETE /api/events/:id
```

### 🆕 Users
```
GET    /api/users
POST   /api/users
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

### 🆕 Audit
```
GET    /api/audit
GET    /api/audit/stats
GET    /api/audit/:id
GET    /api/audit/entity/:entity/:entityId
```

**[Ver documentación completa de la API →](docs/API.md)**

---

## 🎨 TECNOLOGÍAS

### Backend
- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **Prisma ORM** - Base de datos
- **PostgreSQL** - Base de datos
- **Socket.io** - WebSockets
- **JWT** - Autenticación
- **Zod** - Validación
- **Nodemailer** - Emails
- **QRCode** - Generación de QR
- **Multer** - Upload de archivos

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** - Estilos
- **React Router** - Navegación
- **React Hook Form** - Formularios
- **React Hot Toast** - Notificaciones
- **Axios** - HTTP client
- **html5-qrcode** - Escaneo de QR

---

## 🔧 SCRIPTS DISPONIBLES

### Backend
```bash
npm run dev          # Modo desarrollo
npm run build        # Compilar TypeScript
npm start            # Producción
npm run prisma:studio # Abrir Prisma Studio
npm run prisma:seed   # Poblar BD
npm test             # Tests
```

### Frontend
```bash
npm run dev          # Modo desarrollo
npm run build        # Build producción
npm run preview      # Preview build
npm run lint         # Linter
```

---

## 📚 DOCUMENTACIÓN

- **[Guía de Instalación](docs/INSTALACION.md)** - Instalación paso a paso
- **[API Reference](docs/API.md)** - Documentación completa de la API
- **[Módulos](docs/MODULOS.md)** - Documentación de módulos
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Solución de problemas
- **[Changelog](CHANGELOG.md)** - Historial de cambios

---

## 🚀 DEPLOYMENT

### Producción con PM2

```bash
# Backend
cd backend
npm run build
pm2 start dist/server.js --name reservas-backend

# Frontend
cd frontend
npm run build
pm2 serve dist 3000 --name reservas-frontend
```

### Docker (opcional)

```bash
docker-compose up -d
```

---

## 🧪 TESTING

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

---

## 🤝 CONTRIBUIR

1. Fork el proyecto
2. Crea tu rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: nueva característica'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 LICENCIA

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 AUTOR

**Sistema de Reservas**
- GitHub: [@danny9001](https://github.com/danny9001)

---

## 🙏 AGRADECIMIENTOS

- Comunidad de Node.js
- Comunidad de React
- Prisma Team
- Todos los contribuidores

---

## 📞 SOPORTE

Si encuentras algún problema o tienes sugerencias:

1. **Issues**: [Reportar problema](https://github.com/danny9001/sis_res2/issues)
2. **Discussions**: [Iniciar discusión](https://github.com/danny9001/sis_res2/discussions)
3. **Email**: soporte@sistema.com

---

## 🎯 ROADMAP

### v2.2 (Próximamente)
- [ ] Reportes PDF personalizados
- [ ] Integración con pasarelas de pago
- [ ] App móvil nativa
- [ ] Sistema de puntos y recompensas
- [ ] Notificaciones push

### v3.0 (Futuro)
- [ ] Inteligencia artificial para predicciones
- [ ] Integración con calendarios
- [ ] Sistema de marketing automatizado
- [ ] Multi-tenant

---

<p align="center">
  <strong>⭐ Si te gusta este proyecto, dale una estrella en GitHub! ⭐</strong>
</p>

<p align="center">
  Hecho con ❤️ por el equipo de Sistema de Reservas
</p>

<p align="center">
  <sub>v2.1.0 - Noviembre 2024</sub>
</p>
