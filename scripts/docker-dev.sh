#!/bin/bash
# BitSub Docker Development Helper Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 BitSub Docker Development Helper${NC}"
echo ""

# Function to show usage
show_usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  start         - Start BitSub container"
    echo "  start-dev     - Start development container with hot reload"
    echo "  stop          - Stop all containers"
    echo "  restart       - Restart BitSub container"
    echo "  logs          - Show container logs"
    echo "  shell         - Access container shell"
    echo "  build         - Build Docker image"
    echo "  clean         - Stop containers and remove volumes"
    echo "  status        - Show container status"
    echo "  redeploy      - Redeploy canisters in running container"
    echo "  urls          - Show access URLs for BitSub application"
    echo "  open          - Open BitSub in browser automatically"
    echo ""
}

# Function to check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi
}

case "$1" in
    start)
        echo -e "${GREEN}🚀 Starting BitSub container...${NC}"
        check_docker
        docker-compose up --build
        ;;
    start-dev)
        echo -e "${GREEN}🔧 Starting BitSub development container...${NC}"
        check_docker
        docker-compose --profile dev up --build
        ;;
    stop)
        echo -e "${YELLOW}⏹️ Stopping BitSub containers...${NC}"
        docker-compose down
        ;;
    restart)
        echo -e "${YELLOW}🔄 Restarting BitSub container...${NC}"
        docker-compose restart bitsub
        ;;
    logs)
        echo -e "${BLUE}📋 Showing container logs...${NC}"
        docker-compose logs -f
        ;;
    shell)
        echo -e "${BLUE}🐚 Accessing container shell...${NC}"
        docker exec -it bitsub-app bash || docker exec -it bitsub-dev bash
        ;;
    build)
        echo -e "${GREEN}🔨 Building Docker image...${NC}"
        check_docker
        docker-compose build --no-cache
        ;;
    clean)
        echo -e "${RED}🧹 Cleaning up containers and volumes...${NC}"
        read -p "This will remove all data. Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down -v
            docker system prune -f
            echo -e "${GREEN}✅ Cleanup complete${NC}"
        else
            echo -e "${YELLOW}Cleanup cancelled${NC}"
        fi
        ;;
    status)
        echo -e "${BLUE}📊 Container status:${NC}"
        docker-compose ps
        echo ""
        echo -e "${BLUE}Docker system info:${NC}"
        docker system df
        echo ""
        echo -e "${BLUE}🌐 Access URLs:${NC}"
        ./scripts/docker-access.sh
        ;;
    redeploy)
        echo -e "${GREEN}🔄 Redeploying canisters...${NC}"
        docker exec -it bitsub-app bash -c "./scripts/auto-deploy.sh" || \
        docker exec -it bitsub-dev bash -c "./scripts/auto-deploy.sh"
        ;;
    urls)
        ./scripts/docker-access.sh
        ;;
    open)
        ./scripts/open-bitsub.sh
        ;;
    *)
        show_usage
        exit 1
        ;;
esac