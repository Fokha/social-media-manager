#!/bin/bash
# =============================================================================
# Social Media Manager - Deployment Script
# =============================================================================
# Usage: ./deploy.sh [backend|frontend|all]

set -e

# Configuration
VPS_HOST="145.241.106.50"
VPS_USER="ubuntu"
REMOTE_PATH="/home/ubuntu/social-media-manager"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Deploy backend
deploy_backend() {
    log "Deploying backend..."

    # Sync backend files
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude 'data/*.sqlite' \
        --exclude '.env' \
        --exclude 'logs' \
        ./backend/ ${VPS_USER}@${VPS_HOST}:${REMOTE_PATH}/backend/

    # Install dependencies and restart
    ssh ${VPS_USER}@${VPS_HOST} "cd ${REMOTE_PATH}/backend && npm install --production && pm2 restart social-media-api || pm2 start src/index.js --name social-media-api"

    log "Backend deployed successfully!"
}

# Deploy frontend
deploy_frontend() {
    log "Building frontend..."

    cd frontend

    # Build Next.js
    npm run build

    log "Deploying frontend..."

    # Sync frontend files
    rsync -avz --delete \
        --exclude 'node_modules' \
        --exclude '.next/cache' \
        ./ ${VPS_USER}@${VPS_HOST}:${REMOTE_PATH}/frontend/

    # Install dependencies and restart
    ssh ${VPS_USER}@${VPS_HOST} "cd ${REMOTE_PATH}/frontend && npm install --production && pm2 restart social-media-frontend || pm2 start npm --name social-media-frontend -- start"

    cd ..

    log "Frontend deployed successfully!"
}

# Setup nginx
setup_nginx() {
    log "Setting up nginx configuration..."

    # Copy nginx config
    scp ./nginx.conf ${VPS_USER}@${VPS_HOST}:/tmp/social-media-manager.conf

    ssh ${VPS_USER}@${VPS_HOST} "sudo mv /tmp/social-media-manager.conf /etc/nginx/sites-available/social-media-manager && sudo ln -sf /etc/nginx/sites-available/social-media-manager /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx"

    log "Nginx configured successfully!"
}

# Main
case "$1" in
    backend)
        deploy_backend
        ;;
    frontend)
        deploy_frontend
        ;;
    nginx)
        setup_nginx
        ;;
    all)
        deploy_backend
        deploy_frontend
        setup_nginx
        ;;
    *)
        echo "Usage: $0 {backend|frontend|nginx|all}"
        exit 1
        ;;
esac

log "Deployment complete!"
