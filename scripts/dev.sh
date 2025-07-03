#!/bin/bash

echo "🚀 Starting BitSub Development Environment"

# Kill existing processes
pkill -f dfx || true
pkill -f "next dev" || true

# Start DFX replica
echo "🔧 Starting DFX replica..."
dfx start --clean --background

# Setup frontend environment
echo "⚙️ Setting up frontend..."
cd frontend

npm run build

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_SUBSCRIPTION_MANAGER_CANISTER_ID=$SUBSCRIPTION_ID
NEXT_PUBLIC_WALLET_MANAGER_CANISTER_ID=$WALLET_ID
NEXT_PUBLIC_TRANSACTION_LOG_CANISTER_ID=$TRANSACTION_ID
NEXT_PUBLIC_IC_HOST=http://localhost:4943
NEXT_PUBLIC_INTERNET_IDENTITY_URL=http://localhost:4943/?canisterId=bw4dl-smaaa-aaaaa-qaacq-cai
EOF

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

cd ..

# Deploy canisters
echo "📦 Deploying canisters..."
dfx deploy


# Get canister IDs
SUBSCRIPTION_ID=$(dfx canister id subscription_manager)
WALLET_ID=$(dfx canister id wallet_manager)
TRANSACTION_ID=$(dfx canister id transaction_log)

echo "📋 Canister IDs:"
echo "  Subscription Manager: $SUBSCRIPTION_ID"
echo "  Wallet Manager: $WALLET_ID"
echo "  Transaction Log: $TRANSACTION_ID"


echo ""
echo "✅ Development environment ready!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 DFX Dashboard: http://localhost:4943/_/dashboard"
echo "🆔 Internet Identity: http://localhost:4943/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'echo "🛑 Stopping services..."; pkill -f dfx; pkill -f "next dev"; exit 0' INT
wait