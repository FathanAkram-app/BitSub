#!/bin/bash

# BitSub Canister Registry Initialization Script
echo "🔧 Initializing BitSub Canister Registry"
echo "========================================"

# Check if dfx is running
if ! dfx ping local &> /dev/null; then
    echo "❌ Local replica is not running"
    echo "💡 Start with: dfx start --background"
    exit 1
fi

# Get current canister IDs
echo "📡 Getting canister IDs..."

SUBSCRIPTION_MANAGER=$(dfx canister id subscription_manager 2>/dev/null || echo "")
WALLET_MANAGER=$(dfx canister id wallet_manager 2>/dev/null || echo "")
PAYMENT_PROCESSOR=$(dfx canister id payment_processor 2>/dev/null || echo "")
OKX_INTEGRATION=$(dfx canister id okx_integration 2>/dev/null || echo "")
# BITCOIN_TESTNET was removed

if [ -z "$SUBSCRIPTION_MANAGER" ]; then
    echo "❌ subscription_manager canister not found"
    echo "💡 Deploy with: dfx deploy subscription_manager"
    exit 1
fi

if [ -z "$WALLET_MANAGER" ]; then
    echo "❌ wallet_manager canister not found"
    echo "💡 Deploy with: dfx deploy wallet_manager"
    exit 1
fi

echo "✅ subscription_manager: $SUBSCRIPTION_MANAGER"
echo "✅ wallet_manager: $WALLET_MANAGER"
echo "✅ payment_processor: $PAYMENT_PROCESSOR"
echo "✅ okx_integration: $OKX_INTEGRATION"
# bitcoin_testnet removed

echo ""
echo "🔧 Registering canisters in subscription_manager..."

# Register wallet_manager
if [ -n "$WALLET_MANAGER" ]; then
    echo "📝 Registering wallet_manager..."
    dfx canister call subscription_manager registerCanister "(\"wallet_manager\", principal \"$WALLET_MANAGER\")" &> /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ wallet_manager registered successfully"
    else
        echo "❌ Failed to register wallet_manager"
    fi
fi

# Register okx_integration
if [ -n "$OKX_INTEGRATION" ]; then
    echo "📝 Registering okx_integration..."
    dfx canister call subscription_manager registerCanister "(\"okx_integration\", principal \"$OKX_INTEGRATION\")" &> /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ okx_integration registered successfully"
    else
        echo "❌ Failed to register okx_integration"
    fi
fi

# Register payment_processor
if [ -n "$PAYMENT_PROCESSOR" ]; then
    echo "📝 Registering payment_processor..."
    dfx canister call subscription_manager registerCanister "(\"payment_processor\", principal \"$PAYMENT_PROCESSOR\")" &> /dev/null
    if [ $? -eq 0 ]; then
        echo "✅ payment_processor registered successfully"
    else
        echo "❌ Failed to register payment_processor"
    fi
fi

# bitcoin_testnet canister was removed

echo ""
echo "🔍 Verifying registrations..."

# Verify registrations
for canister in "wallet_manager" "okx_integration" "payment_processor"; do
    REGISTERED=$(dfx canister call subscription_manager getCanister "(\"$canister\")" 2>/dev/null | grep -o 'principal "[^"]*"' | sed 's/principal "\(.*\)"/\1/')
    if [ -n "$REGISTERED" ]; then
        echo "✅ $canister: $REGISTERED"
    else
        echo "❌ $canister: Not registered"
    fi
done

echo ""
echo "🎉 Canister registry initialization complete!"
echo ""
echo "💡 Next steps:"
echo "• Payment processing should now work correctly"
echo "• Wallet balance detection is fixed"
echo "• Run automatic payments: dfx canister call payment_processor triggerPaymentProcessing"
echo "• Check system status: ./scripts/check-payment-system.sh"