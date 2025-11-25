# 📡 API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
Todos los endpoints (excepto /auth) requieren token JWT en el header:
```
Authorization: Bearer <token>
```

## Endpoints

### Auth
- `POST /auth/login` - Login
- `POST /auth/register` - Registro
- `POST /auth/refresh` - Refresh token
- `GET /auth/me` - Usuario actual

### Reservations
- `GET /reservations` - Listar reservas
- `POST /reservations` - Crear reserva
- `GET /reservations/:id` - Ver reserva
- `PUT /reservations/:id` - Actualizar reserva
- `DELETE /reservations/:id` - Eliminar reserva

### Analytics (v2.1)
- `GET /analytics/dashboard` - Dashboard
- `GET /analytics/events` - Por evento
- `GET /analytics/relators` - Relacionadores
- `GET /analytics/sectors` - Por sector
- `GET /analytics/revenue` - Ingresos

Ver README.md para lista completa.
