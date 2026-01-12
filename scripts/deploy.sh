#!/bin/bash

echo "=== Social Media Manager Deployment Script ==="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Railway is installed
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Installing Railway CLI...${NC}"
    npm install -g @railway/cli
fi

# Check if Vercel is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}Installing Vercel CLI...${NC}"
    npm install -g vercel
fi

echo ""
echo "=== Step 1: Deploy Backend to Railway ==="
echo ""

# Login to Railway
echo -e "${YELLOW}Logging into Railway...${NC}"
railway login

# Create project and deploy backend
cd backend
echo -e "${YELLOW}Creating Railway project...${NC}"
railway init

# Add PostgreSQL
echo -e "${YELLOW}Adding PostgreSQL...${NC}"
railway add --plugin postgresql

# Add Redis
echo -e "${YELLOW}Adding Redis...${NC}"
railway add --plugin redis

# Set environment variables
echo -e "${YELLOW}Setting environment variables...${NC}"
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set JWT_EXPIRES_IN=7d

# Deploy
echo -e "${YELLOW}Deploying backend...${NC}"
railway up

# Get backend URL
BACKEND_URL=$(railway domain)
echo -e "${GREEN}Backend deployed at: $BACKEND_URL${NC}"

cd ..

echo ""
echo "=== Step 2: Deploy Frontend to Vercel ==="
echo ""

# Login to Vercel
echo -e "${YELLOW}Logging into Vercel...${NC}"
vercel login

# Build Flutter app
cd flutter_app
echo -e "${YELLOW}Building Flutter web app...${NC}"
flutter build web --release --no-tree-shake-icons

# Deploy to Vercel
cd build/web
echo -e "${YELLOW}Deploying to Vercel...${NC}"
vercel --prod

echo ""
echo -e "${GREEN}=== Deployment Complete! ===${NC}"
echo ""
echo "Next steps:"
echo "1. Update Flutter app's API_BASE_URL to point to Railway backend"
echo "2. Add your OpenAI/Anthropic API keys in Railway dashboard"
echo "3. Configure OAuth credentials for social platforms"
