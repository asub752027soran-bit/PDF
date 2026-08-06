#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Automated Deployment for PDFEditfy"
echo "=========================================="

# 1. Prevent Out-Of-Memory (OOM) build failures on VPS
if [ ! -f /swapfile ] && [ "$EUID" -eq 0 ]; then
    echo "⚙️ Creating 2GB swap space to prevent build memory errors..."
    fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile || true
    echo '/swapfile none swap sw 0 0' >> /etc/fstab || true
    echo "✅ Swap memory enabled."
fi

# 2. Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# 3. Build application with extended heap memory
echo "🏗️ Building application..."
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# 4. Restart or Launch PM2
echo "🔄 Starting PM2 process..."
pm2 delete pdfeditfy 2>/dev/null || true
pm2 start dist/server.cjs --name "pdfeditfy" --cwd /var/www/pdfeditfy -f
pm2 save

echo "=========================================="
echo "🎉 Deployment completed successfully!"
echo "Website is active on http://127.0.0.1:3000"
echo "=========================================="
