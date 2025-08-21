# BitSub Docker Setup

This directory contains Docker configuration for running BitSub in a containerized environment.

## Prerequisites

- Docker installed on your system
- Docker Compose installed
- At least 4GB RAM available for Docker

## Quick Start

### Option 1: Production-like Environment

```bash
# Build and start the container
docker-compose up --build

# Access the application
open http://localhost:4943
```

### Option 2: Development Environment (with hot reload)

```bash
# Start development environment
docker-compose --profile dev up --build

# Frontend with hot reload: http://localhost:5173
# DFX Replica: http://localhost:4944
```

## Container Services

### Main Service (`bitsub`)
- Runs the complete BitSub application
- Builds and deploys all canisters
- Serves the frontend on port 4943
- Includes automatic deployment and initialization

### Development Service (`bitsub-dev`)
- Development environment with hot reload
- Frontend dev server on port 5173
- Separate DFX instance on port 4944
- Only starts with `--profile dev` flag

## Docker Commands

```bash
# Build the container
docker-compose build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Access container shell
docker exec -it bitsub-app bash

# Stop containers
docker-compose down

# Remove volumes (reset state)
docker-compose down -v

# Restart specific service
docker-compose restart bitsub
```

## Development Workflow

1. **Start Development Container:**
   ```bash
   docker-compose --profile dev up --build
   ```

2. **Make Code Changes:**
   - Frontend changes will hot-reload automatically
   - Backend changes require canister redeployment

3. **Redeploy Canisters (after backend changes):**
   ```bash
   docker exec -it bitsub-dev bash
   ./scripts/auto-deploy.sh
   ```

4. **Access Services:**
   - Frontend Dev: http://localhost:5173
   - DFX Candid UI: http://localhost:4944/?canisterId=...
   - Production-like: http://localhost:4943

## Volume Persistence

The setup includes persistent volumes for:
- `dfx-data`: DFX cache and state
- `dfx-config`: DFX configuration
- `node-modules`: Frontend dependencies

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker-compose logs bitsub

# Rebuild from scratch
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

### Port Conflicts
If ports 4943 or 5173 are in use, modify the ports in `docker-compose.yml`:
```yaml
ports:
  - "4945:4943"  # Use different host port
```

### Frontend Build Issues
```bash
# Rebuild frontend in container
docker exec -it bitsub-app bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
cd ..
dfx deploy bitsub_frontend
```

## Environment Variables

The container sets up the following environment variables:
- `DFX_NETWORK=local`
- `NODE_ENV=development`
- `DEBIAN_FRONTEND=noninteractive`

Frontend `.env` file is auto-generated with canister IDs during deployment.

## Security Notes

- The container runs as a non-root user (`bitsub`)
- Only necessary ports are exposed
- DFX runs in local development mode (not suitable for production IC deployment)

## Production Deployment

For production deployment to the Internet Computer:
1. Use the existing `scripts/deploy-mainnet.sh` script
2. Ensure proper identity and wallet setup
3. Consider using IC SDK directly rather than Docker for mainnet deployment