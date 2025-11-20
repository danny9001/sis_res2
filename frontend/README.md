# Frontend - Sistema de Reservas

Aplicación web construida con React, TypeScript, TailwindCSS y React Query.

## 📁 Estructura

```
frontend/
├── src/
│   ├── components/     # Componentes reutilizables
│   │   ├── common/     # Componentes comunes
│   │   ├── layout/     # Layout y navegación
│   │   ├── admin/      # Componentes de admin
│   │   ├── approver/   # Componentes de aprobador
│   │   └── relator/    # Componentes de relacionador
│   ├── pages/          # Páginas/Vistas
│   │   ├── auth/       # Login, registro
│   │   ├── reservations/ # Gestión de reservas
│   │   ├── approvals/  # Aprobaciones
│   │   ├── analytics/  # Analíticas
│   │   └── admin/      # Panel de administración
│   ├── contexts/       # Context API providers
│   ├── services/       # Servicios API
│   ├── hooks/          # Custom hooks
│   ├── utils/          # Utilidades
│   └── types/          # TypeScript types
├── public/             # Archivos estáticos
└── index.html          # HTML principal
```

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar VITE_API_URL

# Iniciar en desarrollo
npm run dev

# La app estará en http://localhost:3000
```

## 🎨 Tecnologías

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Query** - Data fetching & caching
- **React Router v6** - Routing
- **React Hook Form** - Form handling
- **Zod** - Validation
- **Socket.io Client** - Real-time updates
- **Axios** - HTTP client
- **Lucide React** - Icons

## 📦 Características

- ✅ Autenticación JWT
- ✅ Dashboard por rol
- ✅ Gestión de reservas
- ✅ Sistema de aprobaciones
- ✅ Notificaciones en tiempo real
- ✅ Responsive design (Mobile-first)
- ✅ Validación de formularios
- ✅ Gestión de estado optimizada
- ✅ TypeScript types
- ✅ Dark mode ready

## 🎭 Vistas por Rol

### Administrador
- Dashboard completo
- Gestión de sectores
- Gestión de eventos
- Gestión de usuarios
- Auditoría del sistema
- Analíticas avanzadas

### Aprobador
- Dashboard personal
- Aprobaciones pendientes
- Historial de aprobaciones
- Estadísticas de sector

### Relacionador
- Dashboard personal
- Crear reservas
- Ver mis reservas
- Estadísticas personales

## 🎨 Componentes Principales

### Layout
- `Navbar` - Barra de navegación superior
- `Sidebar` - Menú lateral con rutas por rol
- `Layout` - Wrapper principal

### Páginas
- `Login` - Autenticación
- `Dashboard` - Panel principal
- `ReservationsPage` - Lista de reservas
- `NewReservationPage` - Crear reserva
- `ApprovalsPage` - Gestión de aprobaciones
- `AnalyticsPage` - Estadísticas

### Comunes
- `Button` - Botones reutilizables
- `Input` - Inputs con validación
- `Modal` - Modales
- `Table` - Tablas
- `Card` - Tarjetas

## 🔐 Autenticación

El sistema usa JWT almacenado en localStorage:

```typescript
// Uso del contexto de autenticación
const { user, login, logout } = useAuth()

// Login
await login('email@example.com', 'password')

// Logout
logout()
```

## 📡 Servicios API

Todos los servicios API están en `src/services/`:

```typescript
import * as reservationService from '@/services/reservationService'

// Obtener reservas
const reservations = await reservationService.getReservations()

// Crear reserva
await reservationService.createReservation(data)
```

## 🎯 Hooks Personalizados

```typescript
// useAuth - Autenticación
const { user, isAuthenticated, login, logout } = useAuth()

// useReservations - Gestión de reservas
const { reservations, isLoading, createReservation } = useReservations()

// useNotifications - Notificaciones en tiempo real
const { notifications } = useNotifications()
```

## 🎨 Estilos

El proyecto usa TailwindCSS con clases personalizadas:

```css
/* Botones */
.btn-primary
.btn-secondary
.btn-danger

/* Inputs */
.input

/* Cards */
.card
```

## 📱 Responsive

- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🔌 WebSockets

Conexión automática para notificaciones en tiempo real:

```typescript
import { useEffect } from 'react'
import { io } from 'socket.io-client'

const socket = io(import.meta.env.VITE_SOCKET_URL)

socket.on('new-approval-request', (data) => {
  // Manejar notificación
})
```

## 📝 Scripts

```bash
npm run dev       # Desarrollo
npm run build     # Build producción
npm run preview   # Preview build
npm run lint      # Linter
```

## 🚀 Deploy

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod
```

## 🐛 Debug

Para debugging en desarrollo:
```bash
VITE_DEBUG=true npm run dev
```
