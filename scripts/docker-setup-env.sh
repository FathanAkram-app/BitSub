#!/bin/bash
# Docker environment setup script

set -e

echo "📝 Setting up environment variables..."

# Get canister IDs
SUBSCRIPTION_MANAGER_ID=$(dfx canister id subscription_manager)
WALLET_MANAGER_ID=$(dfx canister id wallet_manager)
PAYMENT_PROCESSOR_ID=$(dfx canister id payment_processor)
OKX_INTEGRATION_ID=$(dfx canister id okx_integration)
FRONTEND_ID=$(dfx canister id bitsub_frontend)
INTERNET_IDENTITY_ID=$(dfx canister id internet_identity)

# Create .env file
cat > frontend/.env << EOF
# BitSub Environment Variables (Auto-Generated)

# Network Configuration
VITE_DFX_NETWORK=local
VITE_HOST=http://localhost:8000

# Canister IDs (Auto-Updated)
VITE_SUBSCRIPTION_MANAGER_CANISTER_ID=$SUBSCRIPTION_MANAGER_ID
VITE_WALLET_MANAGER_CANISTER_ID=$WALLET_MANAGER_ID
VITE_PAYMENT_PROCESSOR_CANISTER_ID=$PAYMENT_PROCESSOR_ID
VITE_OKX_INTEGRATION_CANISTER_ID=$OKX_INTEGRATION_ID
VITE_INTERNET_IDENTITY_CANISTER_ID=$INTERNET_IDENTITY_ID
VITE_BITSUB_FRONTEND_CANISTER_ID=$FRONTEND_ID

# Development Settings
ENABLE_CONSOLE_LOGS=true
EOF

echo "✅ Environment variables configured:"
echo "   Frontend ID: $FRONTEND_ID"
echo "   Internet Identity ID: $INTERNET_IDENTITY_ID"
echo ""
echo "🌐 Access URLs:"
echo "   BitSub App: http://localhost:8000/?canisterId=$FRONTEND_ID"
echo "   Internet Identity: http://localhost:8000/?canisterId=$INTERNET_IDENTITY_ID"