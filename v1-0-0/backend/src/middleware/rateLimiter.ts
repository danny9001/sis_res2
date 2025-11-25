import rateLimit from 'express-rate-limit';

// Rate limiter general para la API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter estricto para auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por ventana
  message: 'Demasiados intentos de inicio de sesión, por favor intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // no contar requests exitosos
});

// Rate limiter para creación de recursos
export const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 creaciones por minuto
  message: 'Demasiadas operaciones de creación, por favor intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter para operaciones sensibles (aprobaciones, rechazos)
export const sensitiveLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // máximo 20 operaciones sensibles por minuto
  message: 'Demasiadas operaciones sensibles, por favor intenta más tarde',
  standardHeaders: true,
  legacyHeaders: false,
});
