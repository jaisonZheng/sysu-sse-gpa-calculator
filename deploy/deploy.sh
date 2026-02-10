#!/bin/bash

# SYSU GPA Calculator Deployment Script
# Run this on the server

set -e

APP_DIR="/var/www/gpa-calculator"
BACKEND_PORT=3002

echo "=== SYSU GPA Calculator Deployment ==="

# Create directories
echo "Creating directories..."
sudo mkdir -p $APP_DIR
cd $APP_DIR

# Clone or pull code
echo "Updating code..."
if [ -d ".git" ]; then
    git pull origin main
else
    echo "Please clone the repository first"
    exit 1
fi

# Setup backend
echo "Setting up backend..."
cd $APP_DIR/backend
npm install
npm run build

# Create data directory
mkdir -p data

# Setup frontend
echo "Setting up frontend..."
cd $APP_DIR/frontend
npm install
npm run build

# Setup PM2
echo "Setting up PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# Stop existing process if running
pm2 delete gpa-backend 2>/dev/null || true

# Start backend with PM2
cd $APP_DIR/backend
pm2 start dist/index.js --name gpa-backend -- --port $BACKEND_PORT
pm2 save

# Setup Nginx
echo "Setting up Nginx..."
sudo cp $APP_DIR/deploy/nginx.conf /etc/nginx/sites-available/gpa-calculator

# Enable site
if [ ! -f "/etc/nginx/sites-enabled/gpa-calculator" ]; then
    sudo ln -s /etc/nginx/sites-available/gpa-calculator /etc/nginx/sites-enabled/
fi

# Test and reload Nginx
sudo nginx -t && sudo systemctl reload nginx

echo "=== Deployment Complete ==="
echo "App should be available at:"
echo "  - http://gpa.jaison.ink (if domain is configured)"
echo "  - http://43.136.42.69:8082 (via IP)"
