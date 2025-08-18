#!/bin/bash

# BitSub Payment Processor Startup Script
echo "🔄 Starting BitSub Payment Processor..."

# Get the payment processor canister ID
PAYMENT_PROCESSOR_ID=$(dfx canister id payment_processor)

if [ -z "$PAYMENT_PROCESSOR_ID" ]; then
    echo "❌ Error: payment_processor canister not found"
    echo "💡 Make sure the canisters are deployed first:"
    echo "   dfx deploy"
    exit 1
fi

echo "📍 Payment Processor Canister ID: $PAYMENT_PROCESSOR_ID"

# Check current status
echo "🔍 Checking payment processor status..."
STATUS=$(dfx canister call payment_processor getProcessorStatus)

if [[ $STATUS == *"true"* ]]; then
    echo "✅ Payment processor is already running"
else
    echo "⏸️  Payment processor is stopped"
    echo "🚀 Starting payment processor..."
    
    # Start the payment processor
    dfx canister call payment_processor startPaymentProcessor
    
    if [ $? -eq 0 ]; then
        echo "✅ Payment processor started successfully!"
        echo "⏰ Automatic payments will be processed every 60 seconds"
        
        # Verify it's running
        NEW_STATUS=$(dfx canister call payment_processor getProcessorStatus)
        if [[ $NEW_STATUS == *"true"* ]]; then
            echo "✅ Verified: Payment processor is now running"
        else
            echo "⚠️  Warning: Payment processor may not have started properly"
        fi
    else
        echo "❌ Error: Failed to start payment processor"
        exit 1
    fi
fi

# Show some helpful information
echo ""
echo "📊 Payment Processor Information:"
echo "   • Processes payments every 60 seconds"
echo "   • Checks for overdue subscriptions automatically"
echo "   • Handles recurring billing cycles"
echo ""
echo "🔧 Manual Commands:"
echo "   • Check status: dfx canister call payment_processor getProcessorStatus"
echo "   • Stop processor: dfx canister call payment_processor stopPaymentProcessor"
echo "   • Manual trigger: dfx canister call payment_processor triggerPaymentProcessing"
echo ""
echo "📈 Monitor automatic payments in the dashboard!"