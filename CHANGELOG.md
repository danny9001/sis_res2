# 📋 CHANGELOG

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [2.1.0] - 2024-11-25

### 🎉 NUEVA VERSIÓN MAYOR - v2.1

### ✨ Agregado

#### Nuevos Módulos

**Personalización del Sitio**
- Subida de logo personalizado
- Configuración de favicon
- Personalización de colores del tema
- Información de contacto configurable
- Redes sociales (Facebook, Instagram, Twitter, WhatsApp)
- Términos y condiciones personalizados
- Restricciones de reservas configurables
- Endpoint público para configuración

**Rol Validador (Porteros)**
- Nuevo rol `VALIDATOR` en el sistema
- Escaneo de códigos QR en la entrada
- Validación manual de códigos
- Vista de solo lectura de reservas
- Búsqueda de invitados por nombre o CI
- Estadísticas de validación en tiempo real
- Dashboard para validadores

**Pases Adicionales**
- Generación de invitados extras para mesas
- Validación automática de capacidad
- QR únicos para cada pase
- Estados: ACTIVE, USED, REVOKED
- Razón obligatoria para trazabilidad
- Email automático al relacionador
- Posibilidad de revocar pases
- Integración con sistema de validación

**Analytics Avanzado**
- Dashboard completo con estadísticas generales
- Analíticas por evento (asistencia, ingresos)
- Rendimiento de relacionadores
- Analíticas por sector (ocupación)
- Ingresos detallados por tipo de pago
- Tendencias temporales
- Exportación a CSV

**Gestión de Sectores**
- CRUD completo de sectores
- Asignación de aprobadores por sector
- Validación de capacidad
- Soft delete
- Estadísticas por sector
- Búsqueda y filtros avanzados
- Código único por sector

**Gestión de Eventos**
- CRUD completo de eventos
- Filtro de próximos eventos
- Capacidad máxima configurable
- Eventos activos/inactivos
- Soft delete
- Asociación con reservas

**Gestión de Usuarios**
- CRUD completo de usuarios
- Soporte para 4 roles (ADMIN, APPROVER, RELATOR, VALIDATOR)
- Cambio de contraseña con hash bcrypt
- Activar/desactivar usuarios
- Búsqueda por nombre y email
- Validación de datos con Zod

**Sistema de Auditoría**
- Log automático de todas las acciones
- Filtros avanzados (usuario, entidad, acción, fecha)
- Estadísticas de uso del sistema
- Historial completo por entidad
- Paginación de resultados
- Identificación de usuarios más activos

#### Nuevos Endpoints

**Settings**
- `GET /api/settings/public` - Configuración pública
- `GET /api/settings` - Ver configuración
- `PUT /api/settings` - Actualizar configuración
- `POST /api/settings/logo` - Subir logo
- `POST /api/settings/favicon` - Subir favicon
- `DELETE /api/settings/logo` - Eliminar logo

**Validator**
- `POST /api/validator/scan` - Validar QR
- `GET /api/validator/stats` - Estadísticas
- `GET /api/validator/reservations` - Ver reservas
- `GET /api/validator/reservation/:id` - Detalles
- `GET /api/validator/search/:query` - Buscar invitado

**Additional Passes**
- `POST /api/additional-passes` - Crear pase
- `GET /api/additional-passes` - Listar pases
- `GET /api/additional-passes/:id` - Detalles
- `GET /api/additional-passes/:id/qr` - Obtener QR
- `POST /api/additional-passes/:id/revoke` - Revocar
- `GET /api/additional-passes/reservation/:id` - Por reserva
- `GET /api/additional-passes/stats/overview` - Estadísticas

**Analytics**
- `GET /api/analytics/dashboard` - Dashboard
- `GET /api/analytics/events` - Por evento
- `GET /api/analytics/relators` - Relacionadores
- `GET /api/analytics/sectors` - Por sector
- `GET /api/analytics/revenue` - Ingresos
- `GET /api/analytics/export` - Exportar CSV

**Sectors**
- `GET /api/sectors` - Listar
- `POST /api/sectors` - Crear
- `GET /api/sectors/:id` - Ver
- `PUT /api/sectors/:id` - Actualizar
- `DELETE /api/sectors/:id` - Eliminar
- `POST /api/sectors/:id/approvers` - Asignar aprobador
- `DELETE /api/sectors/:id/approvers/:userId` - Remover aprobador
- `GET /api/sectors/:id/stats` - Estadísticas

**Events**
- `GET /api/events` - Listar
- `POST /api/events` - Crear
- `GET /api/events/:id` - Ver
- `PUT /api/events/:id` - Actualizar
- `DELETE /api/events/:id` - Eliminar

**Users**
- `GET /api/users` - Listar (ADMIN)
- `POST /api/users` - Crear (ADMIN)
- `GET /api/users/:id` - Ver (ADMIN)
- `PUT /api/users/:id` - Actualizar (ADMIN)
- `DELETE /api/users/:id` - Eliminar (ADMIN)

**Audit**
- `GET /api/audit` - Listar logs
- `GET /api/audit/stats` - Estadísticas
- `GET /api/audit/:id` - Ver log
- `GET /api/audit/entity/:entity/:entityId` - Historial

#### Nuevas Tablas en Base de Datos

- `SiteSettings` - Configuración del sitio
- `AdditionalPass` - Pases adicionales
- Enum `UserRole` extendido con `VALIDATOR`

#### Nuevas Dependencias

**Backend**
- `multer` - Upload de archivos
- `html5-qrcode` - Escaneo de QR

**Frontend**
- `html5-qrcode` - Scanner component

### 🔧 Mejorado

- **Server.ts** - Reorganizado con todos los módulos
- **Package.json** - Actualizado a v2.1.0
- **README.md** - Documentación completa actualizada
- **Health Check** - Ahora muestra todos los módulos cargados
- **Sistema de Permisos** - Extendido para nuevos roles
- **Auditoría** - Ahora registra todas las acciones de módulos nuevos
- **WebSockets** - Mejorado para nuevos eventos

### 📚 Documentación

- Guía completa de instalación
- Documentación de API actualizada
- Guía de cada módulo nuevo
- Ejemplos de uso
- Troubleshooting extendido

### 🔒 Seguridad

- Validación de archivos subidos (logo/favicon)
- Límite de tamaño de archivos (5MB)
- Sanitización de datos de entrada
- Control de acceso por rol reforzado

---

## [2.0.0] - 2024-11-01

### ✨ Agregado

#### Sistema Base

**Autenticación**
- Login con email y contraseña
- JWT con refresh tokens
- Registro de usuarios
- Recuperación de contraseña

**Reservas**
- Crear reservas para eventos
- Tipos de mesa (JET-15, FLY-10, etc.)
- Asignación de sectores
- Invitados por mesa
- Códigos QR únicos

**Aprobaciones**
- Sistema multinivel
- Estados: PENDING, APPROVED, REJECTED
- Notificaciones automáticas
- Historial de aprobaciones

**Notificaciones**
- Emails automáticos
- Notificaciones en tiempo real
- WebSockets

**QR**
- Generación automática
- Validación en entrada
- Historial de escaneos

#### Roles Iniciales
- ADMIN - Administrador total
- APPROVER - Aprobador de reservas
- RELATOR - Creador de reservas

### 🔧 Configuración Inicial

- PostgreSQL como base de datos
- Prisma ORM
- Express.js backend
- React frontend
- TailwindCSS

---

## [1.0.0] - 2024-10-01

### ✨ Inicial

- Primera versión del sistema
- Funcionalidades básicas de reservas
- Sistema de autenticación simple

---

## [Unreleased]

### 🚀 Próximamente en v2.2

- Reportes PDF personalizados
- Integración con pasarelas de pago
- Sistema de puntos y recompensas
- Notificaciones push
- Mejoras en dashboard

---

## Tipos de Cambios

- **✨ Agregado** - Para nuevas características
- **🔧 Mejorado** - Para cambios en funcionalidad existente
- **⚠️ Deprecado** - Para características que serán eliminadas
- **❌ Eliminado** - Para características eliminadas
- **🐛 Corregido** - Para corrección de bugs
- **🔒 Seguridad** - Para parches de seguridad

---

## Enlaces

- [2.1.0]: https://github.com/danny9001/sis_res2/releases/tag/v2.1.0
- [2.0.0]: https://github.com/danny9001/sis_res2/releases/tag/v2.0.0
- [1.0.0]: https://github.com/danny9001/sis_res2/releases/tag/v1.0.0
