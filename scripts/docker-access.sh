#!/bin/bash
# BitSub Docker Access Helper - Get URLs to access the application

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 BitSub Docker Access URLs${NC}"
echo ""

# Check if container is running
if ! docker ps | grep -q "bitsub-app\|bitsub-dev"; then
    echo -e "${YELLOW}⚠️  No BitSub containers are currently running.${NC}"
    echo ""
    echo "Start BitSub with one of these commands:"
    echo "  docker-compose up --build                 # Production-like"
    echo "  docker-compose --profile dev up --build   # Development"
    echo "  ./scripts/docker-dev.sh start             # Using helper"
    exit 1
fi

# Function to get canister ID from running container
get_canister_id() {
    local container_name="$1"
    local canister_name="$2"
    
    if docker ps --format "table {{.Names}}" | grep -q "$container_name"; then
        docker exec -it "$container_name" dfx canister id "$canister_name" 2>/dev/null | tr -d '\r' || echo ""
    else
        echo ""
    fi
}

# Try to get canister IDs from either container
FRONTEND_ID=$(get_canister_id "bitsub-app" "bitsub_frontend")
if [ -z "$FRONTEND_ID" ]; then
    FRONTEND_ID=$(get_canister_id "bitsub-dev" "bitsub_frontend")
fi

INTERNET_IDENTITY_ID=$(get_canister_id "bitsub-app" "internet_identity")
if [ -z "$INTERNET_IDENTITY_ID" ]; then
    INTERNET_IDENTITY_ID=$(get_canister_id "bitsub-dev" "internet_identity")
fi

# Determine which container and ports are running
if docker ps --format "table {{.Names}}" | grep -q "bitsub-dev"; then
    echo -e "${GREEN}🔧 Development Mode URLs:${NC}"
    echo ""
    echo "🚀 Main Access Points:"
    if [ -n "$FRONTEND_ID" ]; then
        echo "   BitSub App (Production): http://localhost:8001/?canisterId=$FRONTEND_ID"
    fi
    echo "   Frontend (Hot Reload):   http://localhost:5173"
    echo ""
    echo "🔐 Authentication:"
    if [ -n "$INTERNET_IDENTITY_ID" ]; then
        echo "   Internet Identity:       http://localhost:8001/?canisterId=$INTERNET_IDENTITY_ID"
    fi
    echo ""
    echo "🛠️  Development Tools:"
    echo "   Candid Interface:        http://localhost:8001/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai"
    echo "   DFX Replica:             http://localhost:8001"
    
elif docker ps --format "table {{.Names}}" | grep -q "bitsub-app"; then
    echo -e "${GREEN}🚀 Production Mode URLs:${NC}"
    echo ""
    echo "🌐 Main Access Points:"
    if [ -n "$FRONTEND_ID" ]; then
        echo "   BitSub App:              http://localhost:8000/?canisterId=$FRONTEND_ID"
        echo "   BitSub App (Alternative): http://$FRONTEND_ID.localhost:8000"
    else
        echo "   BitSub App:              http://localhost:8000"
    fi
    echo ""
    echo "🔐 Authentication:"
    if [ -n "$INTERNET_IDENTITY_ID" ]; then
        echo "   Internet Identity:       http://localhost:8000/?canisterId=$INTERNET_IDENTITY_ID"
        echo "   Internet Identity (Alt): http://$INTERNET_IDENTITY_ID.localhost:8000"
    fi
    echo ""
    echo "🛠️  Development Tools:"
    echo "   Candid Interface:        http://localhost:8000/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai"
    echo "   DFX Replica:             http://localhost:8000"
fi

echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "• If .localhost URLs don't work, use the ?canisterId= format"
echo "• The first URL is usually the most reliable"
echo "• Container logs: docker-compose logs -f"
echo "• Container shell: docker exec -it bitsub-app bash"
echo ""

# Check if URLs are accessible
echo -e "${YELLOW}🔍 Checking connectivity...${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 | grep -q "200\|302"; then
    echo "✅ Port 8000 is accessible"
elif curl -s -o /dev/null -w "%{http_code}" http://localhost:8001 | grep -q "200\|302"; then
    echo "✅ Port 8001 is accessible (dev mode)"
elif curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200\|302"; then
    echo "✅ Port 5173 is accessible (frontend dev server)"
else
    echo "⚠️  No ports responding - container might still be starting"
    echo "   Wait a few minutes and run this script again"
fi