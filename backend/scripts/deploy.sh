#!/bin/bash
set -e

# Social Media Manager Backend Deployment Script

echo "=========================================="
echo "Social Media Manager - Deployment Script"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please copy .env.production to .env and fill in your values"
    exit 1
fi

# Parse arguments
COMPOSE_FILE="docker-compose.yml"
ACTION="up"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --prod) COMPOSE_FILE="docker-compose.prod.yml";;
        --down) ACTION="down";;
        --rebuild) ACTION="rebuild";;
        --logs) ACTION="logs";;
        --status) ACTION="status";;
        *) echo "Unknown parameter: $1"; exit 1;;
    esac
    shift
done

case $ACTION in
    up)
        echo -e "${YELLOW}Starting services...${NC}"
        docker-compose -f $COMPOSE_FILE up -d
        echo -e "${GREEN}Services started successfully!${NC}"
        echo ""
        echo "Check status with: ./scripts/deploy.sh --status"
        echo "View logs with: ./scripts/deploy.sh --logs"
        ;;
    down)
        echo -e "${YELLOW}Stopping services...${NC}"
        docker-compose -f $COMPOSE_FILE down
        echo -e "${GREEN}Services stopped.${NC}"
        ;;
    rebuild)
        echo -e "${YELLOW}Rebuilding and restarting services...${NC}"
        docker-compose -f $COMPOSE_FILE down
        docker-compose -f $COMPOSE_FILE build --no-cache
        docker-compose -f $COMPOSE_FILE up -d
        echo -e "${GREEN}Services rebuilt and started!${NC}"
        ;;
    logs)
        echo -e "${YELLOW}Showing logs (Ctrl+C to exit)...${NC}"
        docker-compose -f $COMPOSE_FILE logs -f
        ;;
    status)
        echo -e "${YELLOW}Service Status:${NC}"
        docker-compose -f $COMPOSE_FILE ps
        echo ""
        echo -e "${YELLOW}Health Check:${NC}"
        curl -s http://localhost:3000/health | jq . 2>/dev/null || echo "Backend not responding"
        ;;
esac
