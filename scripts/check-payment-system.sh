#!/bin/bash

# BitSub Payment System Diagnostic Script
echo "🔍 BitSub Payment System Diagnostic"
echo "======================================"

# Check if dfx is running
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx command not found. Please install dfx first."
    exit 1
fi

# Check if local replica is running
echo "📡 Checking local replica status..."
if dfx ping local &> /dev/null; then
    echo "✅ Local replica is running"
else
    echo "❌ Local replica is not running"
    echo "💡 Start with: dfx start --background"
    exit 1
fi

# Check if canisters are deployed
echo ""
echo "📦 Checking canister deployment..."

REQUIRED_CANISTERS=("subscription_manager" "payment_processor" "wallet_manager" "bitcoin_testnet")

for canister in "${REQUIRED_CANISTERS[@]}"; do
    if dfx canister id $canister &> /dev/null; then
        CANISTER_ID=$(dfx canister id $canister)
        echo "✅ $canister: $CANISTER_ID"
    else
        echo "❌ $canister: Not deployed"
        echo "💡 Deploy with: dfx deploy $canister"
    fi
done

# Check payment processor status
echo ""
echo "⚡ Checking Payment Processor Status..."

if dfx canister id payment_processor &> /dev/null; then
    STATUS=$(dfx canister call payment_processor getProcessorStatus 2>/dev/null)
    
    if [[ $STATUS == *"true"* ]]; then
        echo "✅ Payment processor is RUNNING"
    elif [[ $STATUS == *"false"* ]]; then
        echo "⏸️  Payment processor is STOPPED"
        echo "💡 Start with: ./scripts/start-payment-processor.sh"
    else
        echo "❓ Unable to determine payment processor status"
        echo "🔧 Raw response: $STATUS"
    fi
else
    echo "❌ Payment processor canister not found"
fi

# Check for overdue subscriptions
echo ""
echo "📊 Checking Subscription Status..."

if dfx canister id subscription_manager &> /dev/null; then
    OVERDUE=$(dfx canister call subscription_manager getOverdueSubscriptionsCount 2>/dev/null)
    
    if [[ $OVERDUE =~ [0-9]+ ]]; then
        OVERDUE_NUM=$(echo $OVERDUE | grep -o '[0-9]\+')
        if [ "$OVERDUE_NUM" -gt 0 ]; then
            echo "⚠️  Found $OVERDUE_NUM overdue subscription(s)"
            echo "💡 Process manually: dfx canister call payment_processor triggerPaymentProcessing"
        else
            echo "✅ No overdue subscriptions found"
        fi
    else
        echo "❓ Unable to check overdue subscriptions"
        echo "🔧 Raw response: $OVERDUE"
    fi
else
    echo "❌ Subscription manager canister not found"
fi

# Provide helpful commands
echo ""
echo "🔧 Helpful Commands:"
echo "======================================"
echo "• Start payment processor: ./scripts/start-payment-processor.sh"
echo "• Stop payment processor:  dfx canister call payment_processor stopPaymentProcessor"
echo "• Manual payment run:      dfx canister call payment_processor triggerPaymentProcessing"
echo "• Check processor status:  dfx canister call payment_processor getProcessorStatus"
echo "• Check overdue count:     dfx canister call subscription_manager getOverdueSubscriptionsCount"
echo ""
echo "📚 Next Steps:"
echo "1. If payment processor is stopped, start it with the script above"
echo "2. If there are overdue subscriptions, they'll be processed automatically"
echo "3. Monitor the logs for payment processing activity"
echo "4. Check the admin dashboard for real-time status"