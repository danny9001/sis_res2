# 📋 Instalación en Ubuntu

## Requisitos Previos

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL 14+
sudo apt install -y postgresql postgresql-contrib

# Instalar Git
sudo apt install -y git

# Instalar PM2
sudo npm install -g pm2
```

## Instalación del Proyecto

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/sis_res2.git
cd sis_res2

# Ejecutar script de instalación
bash install.sh
```

Ver README.md para más detalles.
