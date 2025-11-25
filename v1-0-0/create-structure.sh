#!/bin/bash

# Crear estructura del backend
mkdir -p backend/{src/{modules/{auth,users,sectors,events,reservations,approvals,invitations,analytics,audit},config,middleware,utils,types},prisma,tests}

# Crear estructura del frontend
mkdir -p frontend/{src/{components/{common,layout,admin,approver,relator,auth},pages,hooks,services,contexts,utils,types,assets},public}

# Crear archivos raíz
touch backend/.env.example
touch backend/.gitignore
touch backend/package.json
touch backend/tsconfig.json
touch backend/README.md

touch frontend/.env.example
touch frontend/.gitignore
touch frontend/package.json
touch frontend/tsconfig.json
touch frontend/README.md
touch frontend/tailwind.config.js
touch frontend/postcss.config.js

# Archivos de documentación
touch README.md
touch INSTALLATION.md
touch ARCHITECTURE.md
touch .gitignore

echo "Estructura creada exitosamente"
