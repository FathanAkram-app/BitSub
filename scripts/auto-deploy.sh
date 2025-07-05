#!/bin/bash
set -e

echo "🚀 BitSub Auto-Deploy & Setup..."

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

# Start DFX if not running
if ! dfx ping >/dev/null 2>&1; then
  echo "🔄 Starting DFX replica..."
  dfx start --background --clean
  sleep 10
fi

# Deploy all canisters
echo "🔨 Deploying canisters..."
dfx deploy

# Extract canister IDs
echo "📝 Auto-updating .env with canister IDs..."
SUBSCRIPTION_MANAGER_ID=$(dfx canister id subscription_manager)
WALLET_MANAGER_ID=$(dfx canister id wallet_manager)
TRANSACTION_LOG_ID=$(dfx canister id transaction_log)
BITCOIN_INTEGRATION_ID=$(dfx canister id bitcoin_integration)
BITCOIN_TESTNET_ID=$(dfx canister id bitcoin_testnet)
PAYMENT_PROCESSOR_ID=$(dfx canister id payment_processor)
OKX_INTEGRATION_ID=$(dfx canister id okx_integration)
FRONTEND_ID=$(dfx canister id bitsub_frontend)

# Get Internet Identity canister ID
INTERNET_IDENTITY_ID=$(dfx canister id internet_identity)

# Update .env file inside frontend folder
cat > frontend/.env << EOF
# BitSub Environment Variables (Auto-Generated)

# Network Configuration
VITE_DFX_NETWORK=local
VITE_HOST=http://localhost:4943

# Canister IDs (Auto-Updated)
VITE_SUBSCRIPTION_MANAGER_CANISTER_ID=$SUBSCRIPTION_MANAGER_ID
VITE_WALLET_MANAGER_CANISTER_ID=$WALLET_MANAGER_ID
VITE_TRANSACTION_LOG_CANISTER_ID=$TRANSACTION_LOG_ID
VITE_BITCOIN_INTEGRATION_CANISTER_ID=$BITCOIN_INTEGRATION_ID
VITE_BITCOIN_TESTNET_CANISTER_ID=$BITCOIN_TESTNET_ID
VITE_PAYMENT_PROCESSOR_CANISTER_ID=$PAYMENT_PROCESSOR_ID
VITE_OKX_INTEGRATION_CANISTER_ID=$OKX_INTEGRATION_ID
VITE_INTERNET_IDENTITY_CANISTER_ID=$INTERNET_IDENTITY_ID
VITE_BITSUB_FRONTEND_CANISTER_ID=$FRONTEND_ID

# Development Settings
ENABLE_CONSOLE_LOGS=true
EOF

# Rebuild frontend with updated IDs
echo "🏗️ Rebuilding frontend with updated canister IDs..."
cd frontend && npm run build && cd ..

# Redeploy frontend
echo "🔄 Redeploying frontend..."
dfx deploy bitsub_frontend

echo "✅ BitSub ready!"
echo "🌐 Frontend: http://$FRONTEND_ID.localhost:4943"
echo "🔐 Internet Identity: http://$INTERNET_IDENTITY_ID.localhost:4943"
echo "📋 Canister IDs updated in .env file"
echo ""
echo "🎯 Next steps:"
echo "1. Open: http://$FRONTEND_ID.localhost:4943"
echo "2. Login with local Internet Identity"
echo "3. Choose Creator or Subscriber dashboard"
echo "4. Start testing BitSub!"