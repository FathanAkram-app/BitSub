# BitSub Docker Quick Setup Guide

## ⚠️ Important: URL Access

**DO NOT** use `http://localhost:8000` directly - it redirects to the Internet Computer dashboard.

**ALWAYS** use URLs with canister IDs:
- ✅ `http://localhost:8000/?canisterId=<FRONTEND_ID>`  
- ❌ `http://localhost:8000` (redirects to IC dashboard)

The container will show you the exact URLs to use when it starts up.

## 🚀 Quick Start

### 1. Prerequisites
- Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Ensure Docker is running
- At least 4GB RAM available

### 2. Clone & Start
```bash
# Navigate to your BitSub directory
cd /path/to/BitSub

# Start BitSub with Docker
docker-compose up --build

# Wait for "✅ BitSub ready!" message
# Then use the exact URLs shown in the container output
# DO NOT use http://localhost:8000 directly (redirects to IC dashboard)
```

## 🔧 Development Mode

For frontend development with hot reload:

```bash
# Start development environment
docker-compose --profile dev up --build

# Access:
# - Frontend (hot reload): http://localhost:5173
# - DFX Candid UI: http://localhost:8001
```

## 🛠️ Helper Commands

Use the helper script for easier management:

```bash
# Make it executable (first time only)
chmod +x scripts/docker-dev.sh

# Common commands
./scripts/docker-dev.sh start      # Start production-like container
./scripts/docker-dev.sh start-dev  # Start development container
./scripts/docker-dev.sh open       # Open BitSub in browser automatically
./scripts/docker-dev.sh urls       # Show access URLs
./scripts/docker-dev.sh logs       # View logs
./scripts/docker-dev.sh shell      # Access container shell
./scripts/docker-dev.sh stop       # Stop containers
./scripts/docker-dev.sh clean      # Clean up everything
```

## 📁 What Gets Created

The Docker setup creates:
- **Dockerfile**: Main container configuration
- **docker-compose.yml**: Service orchestration
- **.dockerignore**: Build optimization
- **docker-README.md**: Detailed documentation
- **scripts/docker-dev.sh**: Helper script

## 🔍 Container Architecture

```
Ubuntu 22.04 Base
├── Node.js 18 LTS
├── DFX (Internet Computer SDK)
├── BitSub App
│   ├── Backend Canisters (Motoko)
│   └── Frontend (React + Vite)
└── Auto-deploy Scripts
```

## 🌐 Access Points

### Production Mode (`docker-compose up`)

| Service | URL | Description |
|---------|-----|-------------|
| **BitSub App** | `http://localhost:8000/?canisterId=<FRONTEND_ID>` | **Main application (recommended)** |
| BitSub App (Alt) | `http://<FRONTEND_ID>.localhost:8000` | Alternative URL format |
| Internet Identity | `http://localhost:8000/?canisterId=<II_ID>` | Authentication |
| Candid Interface | `http://localhost:8000/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai` | API debugging |

### Development Mode (`--profile dev`)

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend (Hot Reload)** | `http://localhost:5173` | **Development with hot reload** |
| BitSub App | `http://localhost:8001/?canisterId=<FRONTEND_ID>` | Production build |
| Internet Identity | `http://localhost:8001/?canisterId=<II_ID>` | Authentication |
| Candid Interface | `http://localhost:8001/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai` | API debugging |

### 🔧 Get Access URLs Automatically

Run this helper script to get the exact URLs for your running container:

```bash
./scripts/docker-access.sh
```

This script will:
- Detect which container is running (production/dev)
- Get the actual canister IDs
- Show you the correct URLs to access BitSub
- Check connectivity

## 🔧 Development Workflow

1. **Start development container:**
   ```bash
   docker-compose --profile dev up --build
   ```

2. **Edit frontend files:** Changes auto-reload at http://localhost:5173

3. **Edit backend files:** Redeploy canisters:
   ```bash
   docker exec -it bitsub-dev bash
   ./scripts/auto-deploy.sh
   ```

4. **Access container for debugging:**
   ```bash
   docker exec -it bitsub-dev bash
   dfx canister call subscription_manager getAllPublicPlans
   ```

## ⚠️ Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :8000

# Or use different ports in docker-compose.yml:
ports:
  - "8002:4943"  # Change 8000 to 8002
```

### Container Won't Start
```bash
# Check logs
docker-compose logs bitsub

# Rebuild cleanly
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### DFX Issues
```bash
# Access container and restart DFX
docker exec -it bitsub-app bash
dfx stop
dfx start --background --clean
./scripts/auto-deploy.sh
```

## 💡 Tips

- **Persistent Storage**: DFX state and node_modules are preserved in Docker volumes
- **Development**: Use `--profile dev` for hot reload and separate dev environment
- **Production**: Standard `docker-compose up` for production-like setup
- **Cleanup**: Use `./scripts/docker-dev.sh clean` to reset everything
- **Logs**: Monitor with `docker-compose logs -f` or `./scripts/docker-dev.sh logs`

## 🚨 Important Notes

- This Docker setup is for **local development only**
- For IC mainnet deployment, use `scripts/deploy-mainnet.sh` directly
- The container runs DFX in local replica mode
- Internet Identity runs in local development mode

## 📚 Next Steps

1. Start the container: `docker-compose up --build`
2. Wait for deployment to complete
3. Open http://localhost:8000
4. Follow the BitSub setup instructions
5. Create your first subscription plan!

For detailed Docker configuration, see `docker-README.md`.