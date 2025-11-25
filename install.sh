#!/bin/bash

echo "╔════════════════════════════════════════════╗"
echo "║   Sistema de Reservas v2.1.0               ║"
echo "║   Script de Instalación                    ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "   Instala Node.js 18+ y vuelve a ejecutar este script"
    exit 1
fi

# Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL no está instalado"
    echo "   Instala PostgreSQL 14+ y vuelve a ejecutar este script"
    exit 1
fi

echo "✅ Requisitos verificados"
echo ""

# Backend
echo "📦 Instalando dependencias del backend..."
cd backend
npm install

echo "⚙️ Configurando base de datos..."
echo "   Por favor, crea la base de datos manualmente:"
echo "   sudo -u postgres psql"
echo "   CREATE DATABASE sistema_reservas;"
echo "   CREATE USER reservas_user WITH PASSWORD 'tu_password';"
echo "   GRANT ALL PRIVILEGES ON DATABASE sistema_reservas TO reservas_user;"
echo ""
read -p "¿Has creado la base de datos? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Crea la base de datos primero"
    exit 1
fi

echo "🔧 Generando cliente Prisma..."
npx prisma generate

echo "🗄️ Ejecutando migraciones..."
npx prisma migrate deploy

echo "🌱 Poblando base de datos..."
npx prisma db seed

echo "🔨 Compilando backend..."
npm run build

cd ..

# Frontend
echo "📦 Instalando dependencias del frontend..."
cd frontend
npm install

echo "🔨 Compilando frontend..."
npm run build

cd ..

echo ""
echo "╔════════════════════════════════════════════╗"
echo "║   ✅ INSTALACIÓN COMPLETADA                ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Configurar archivos .env en backend y frontend"
echo "   2. Iniciar servicios:"
echo "      Backend:  cd backend && npm run dev"
echo "      Frontend: cd frontend && npm run dev"
echo ""
echo "   O usar PM2 para producción:"
echo "      pm2 start backend/dist/server.js --name reservas-backend"
echo "      pm2 serve frontend/dist 3000 --name reservas-frontend --spa"
echo ""
