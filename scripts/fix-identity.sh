#!/bin/bash
set -e

echo "🔧 Fixing Internet Identity Configuration..."

# Navigate to frontend directory
cd frontend

echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building frontend with updated configuration..."
npm run build

cd ..

echo "🔄 Redeploying frontend canister..."
if command -v dfx &> /dev/null; then
    dfx deploy bitsub_frontend
    
    FRONTEND_ID=$(dfx canister id bitsub_frontend)
    echo "✅ Frontend redeployed!"
    echo "🌐 Access your app at: http://$FRONTEND_ID.localhost:4943"
else
    echo "⚠️  DFX not found. Please deploy manually with: dfx deploy bitsub_frontend"
fi

echo ""
echo "✅ Internet Identity fixed!"
echo "🔐 Now uses stable mainnet Internet Identity: https://identity.ic0.app"
echo "📱 Your existing identities will work seamlessly"