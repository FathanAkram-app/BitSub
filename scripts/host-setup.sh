#!/bin/bash
set -e

echo "🚀 Starting BitSub (Host DFX + Docker Frontend)..."

# Start DFX on host
dfx start --host 0.0.0.0:4943 --background --clean 

# Wait for replica
sleep 5

# Deploy all canisters (using mainnet Internet Identity)
dfx deploy

# Start frontend in Docker
cd frontend
npm install
npm run dev

echo "✅ BitSub ready!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 DFX: http://localhost:4943"
echo "🔐 Internet Identity: https://identity.ic0.app/"