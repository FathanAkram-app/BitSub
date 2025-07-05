#!/bin/bash
set -e

echo "🚀 Deploying BitSub to Mainnet..."

# Create mainnet identity if it doesn't exist
if ! dfx identity list | grep -q "mainnet"; then
  echo "🆔 Creating mainnet identity..."
  dfx identity new mainnet --storage-mode plaintext
fi

# Use mainnet identity
dfx identity use mainnet

# Setup wallet if not configured
echo "💰 Setting up wallet..."
if ! dfx identity get-wallet --network ic 2>/dev/null; then
  echo "Please run: dfx quickstart --network ic"
  echo "Or manually setup wallet with ICP tokens"
  exit 1
fi

# Build frontend with mainnet config
echo "🏗️ Building frontend..."
cp .env.mainnet .env
cd frontend && npm run build && cd ..

# Deploy to mainnet
echo "🌐 Deploying to IC mainnet..."
dfx deploy --network ic

# Update canister IDs in mainnet env
echo "📝 Updating mainnet canister IDs..."
dfx canister --network ic id subscription_manager
dfx canister --network ic id wallet_manager
dfx canister --network ic id transaction_log
dfx canister --network ic id bitcoin_integration
dfx canister --network ic id bitcoin_testnet
dfx canister --network ic id payment_processor
dfx canister --network ic id okx_integration
dfx canister --network ic id bitsub_frontend

echo "✅ Mainnet deployment complete!"
echo "🌐 Frontend URL: https://$(dfx canister --network ic id bitsub_frontend).icp0.io"