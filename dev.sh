#!/bin/bash

echo "🚀 Iniciando Sistema de Reservas en modo desarrollo..."

# Abrir terminal para backend
gnome-terminal --tab --title="Backend" -- bash -c "cd backend && npm run dev; exec bash" &

# Abrir terminal para frontend  
gnome-terminal --tab --title="Frontend" -- bash -c "cd frontend && npm run dev; exec bash" &

echo "✅ Servicios iniciándose en terminales separadas"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:3000"
