#!/bin/bash
# Open BitSub in browser automatically

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Opening BitSub in browser...${NC}"

# Check if container is running
if ! docker ps | grep -q "bitsub-app\|bitsub-dev"; then
    echo -e "${RED}❌ No BitSub containers are currently running.${NC}"
    echo ""
    echo "Start BitSub with:"
    echo "  docker-compose up --build"
    echo "  # or"
    echo "  ./scripts/docker-dev.sh start"
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

# Try to get frontend canister ID
FRONTEND_ID=$(get_canister_id "bitsub-app" "bitsub_frontend")
if [ -z "$FRONTEND_ID" ]; then
    FRONTEND_ID=$(get_canister_id "bitsub-dev" "bitsub_frontend")
fi

if [ -z "$FRONTEND_ID" ]; then
    echo -e "${RED}❌ Could not get BitSub frontend canister ID${NC}"
    echo "The container might still be starting up. Wait a few minutes and try again."
    exit 1
fi

# Determine port based on which container is running
if docker ps --format "table {{.Names}}" | grep -q "bitsub-dev"; then
    PORT="8001"
    MODE="Development"
elif docker ps --format "table {{.Names}}" | grep -q "bitsub-app"; then
    PORT="8000"
    MODE="Production"
else
    echo -e "${RED}❌ No BitSub containers found${NC}"
    exit 1
fi

# Construct URL
BITSUB_URL="http://localhost:${PORT}/?canisterId=${FRONTEND_ID}"

echo -e "${GREEN}🌐 Opening BitSub (${MODE} mode):${NC}"
echo "   $BITSUB_URL"
echo ""

# Try to open in browser (cross-platform)
if command -v open >/dev/null 2>&1; then
    # macOS
    open "$BITSUB_URL"
elif command -v xdg-open >/dev/null 2>&1; then
    # Linux
    xdg-open "$BITSUB_URL"
elif command -v start >/dev/null 2>&1; then
    # Windows
    start "$BITSUB_URL"
else
    echo -e "${YELLOW}⚠️  Could not auto-open browser${NC}"
    echo -e "${BLUE}📋 Copy and paste this URL into your browser:${NC}"
    echo "   $BITSUB_URL"
fi

echo ""
echo -e "${BLUE}💡 Tips:${NC}"
echo "• Don't use http://localhost:${PORT} directly (redirects to IC dashboard)"
echo "• Always use the URL with canisterId parameter"
echo "• If the page doesn't load, wait for deployment to complete"