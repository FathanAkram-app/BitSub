# Docker Configuration Fixes

This document tracks Docker-specific fixes made to ensure BitSub works correctly in containerized environments.

## Network Binding Fix

**Issue**: `Error: Invalid argument: Invalid host: invalid socket address syntax`

**Root Cause**: 
- Original dfx.json configured DFX to bind to `127.0.0.1:4943` (localhost only)
- Docker containers need to bind to `0.0.0.0:4943` to accept connections from the host
- The `--host 0.0.0.0` flag is invalid for DFX command line

**Solution**:
1. **Updated dfx.json**:
   ```json
   "local": {
     "bind": "0.0.0.0:4943",     // Changed from 127.0.0.1:4943
     "bootstrap": {
       "ip": "0.0.0.0",          // Changed from 127.0.0.1
       "port": 4943
     }
   }
   ```

2. **Removed invalid DFX flag**:
   ```bash
   # BEFORE (invalid)
   dfx start --host 0.0.0.0 --background --clean
   
   # AFTER (correct)
   dfx start --background --clean
   ```

**Result**: 
- DFX now binds to all interfaces inside the container
- Docker port mapping `8000:4943` allows host access on port 8000
- BitSub accessible at `http://localhost:8000/?canisterId=<FRONTEND_ID>`

## Port Configuration

**Changes Made**:
- Host access port: `4943` → `8000` (production)
- Host access port: `4944` → `8001` (development)
- Container internal port: `4943` (unchanged)
- Frontend dev server: `5173` (unchanged)

**Files Updated**:
- `docker-compose.yml` - Port mappings
- `dfx.json` - Network binding configuration
- `scripts/docker-setup-env.sh` - Environment variables
- `scripts/docker-access.sh` - URL generation
- `DOCKER_SETUP.md` - Documentation

## Testing

To verify the fix works:

```bash
# 1. Build and start container
docker-compose up --build

# 2. Check container logs (should not show socket errors)
docker-compose logs bitsub

# 3. Verify DFX is accessible
curl -I http://localhost:8000

# 4. Get exact URLs
./scripts/docker-access.sh
```

Expected output should include:
```
✅ BitSub is running!
✅ Port 8000 is accessible
```

## Compatibility Notes

- **Local Development**: The dfx.json changes only affect Docker containers. Local development with `dfx start` continues to work normally.
- **Production Deployment**: IC mainnet deployment is unaffected by these Docker-specific network configurations.
- **Development Profile**: Both production and development Docker profiles use the same network binding fix.