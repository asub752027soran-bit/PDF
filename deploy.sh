#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Automated Deployment for PDFEditfy (pdfeditfy.com)"
echo "=========================================="

# 0. Ensure we are in the project directory
CURRENT_DIR=$(pwd)
if [ ! -f "$CURRENT_DIR/package.json" ]; then
    if [ -d "/var/www/pdfeditfy" ] && [ -f "/var/www/pdfeditfy/package.json" ]; then
        cd /var/www/pdfeditfy
    else
        echo "❌ Error: package.json not found in $CURRENT_DIR or /var/www/pdfeditfy."
        echo "Please run this script inside your project directory!"
        exit 1
    fi
fi

# 1. Prevent Out-Of-Memory (OOM) build failures on VPS with swap space
if [ ! -f /swapfile ] && [ "$EUID" -eq 0 ]; then
    echo "⚙️ Configuring swap space to prevent memory allocation failures..."
    (fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048) 2>/dev/null || true
    chmod 600 /swapfile 2>/dev/null || true
    mkswap /swapfile 2>/dev/null || true
    swapon /swapfile 2>/dev/null || true
    echo '/swapfile none swap sw 0 0' >> /etc/fstab 2>/dev/null || true
    echo "✅ Swap memory checked."
fi

# 2. Check and install PM2 globally if missing
if ! command -v pm2 &> /dev/null; then
    echo "⚙️ PM2 is not installed globally. Installing pm2..."
    npm install -g pm2 || sudo npm install -g pm2
fi

# 3. Clean old build and install dependencies
echo "📦 Installing npm dependencies..."
npm install

# 4. Build application with extended heap memory
echo "🏗️ Building application bundle (client + server)..."
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# 5. Verify build output
if [ ! -f "dist/server.cjs" ] || [ ! -f "dist/index.html" ]; then
    echo "❌ Build failed: dist/server.cjs or dist/index.html is missing."
    exit 1
fi

# 6. Restart or Launch PM2
echo "🔄 Launching application via PM2..."
pm2 delete pdfeditfy 2>/dev/null || true
pm2 start dist/server.cjs --name "pdfeditfy" --cwd "$(pwd)" -f
pm2 save

echo "=========================================="
echo "🎉 Deployment finished successfully!"
echo "App is active on http://127.0.0.1:3000"
echo "Check PM2 logs with: pm2 logs pdfeditfy"
echo "=========================================="
