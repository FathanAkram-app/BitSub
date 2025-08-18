#!/bin/bash

# BitSub Webhook Demo Script
# Demonstrates complete webhook integration with BitSub platform

echo "🎯 BitSub Webhook Integration Demo"
echo "================================="

# Step 1: Start webhook server
echo "🚀 Step 1: Starting webhook server..."
npm start &
SERVER_PID=$!
sleep 3

echo "✅ Webhook server running (PID: $SERVER_PID)"
echo "📊 Dashboard: http://localhost:3001"
echo ""

# Step 2: Create a test plan with webhook
echo "🏗️  Step 2: Creating test plan in BitSub..."
PLAN_RESULT=$(dfx canister call subscription_manager createPlan '(record { 
    title = "Demo Webhook Plan"; 
    description = "Testing webhook integration"; 
    amount = 2500; 
    interval = variant { Weekly }; 
    webhookUrl = "http://localhost:3001/webhook" 
})')

PLAN_ID=$(echo "$PLAN_RESULT" | sed -n 's/.*ok = "\([^"]*\)".*/\1/p')

if [ -n "$PLAN_ID" ]; then
    echo "✅ Plan created: $PLAN_ID"
else
    echo "❌ Failed to create plan"
    kill $SERVER_PID
    exit 1
fi

# Step 3: Configure webhook
echo ""
echo "🔧 Step 3: Configuring webhook..."
dfx canister call subscription_manager configureWebhook "(
    \"$PLAN_ID\",
    record {
        url = \"http://localhost:3001/webhook\";
        secret = \"webhook-test-secret-123\";
        events = vec { 
            variant { SubscriptionCreated };
            variant { PaymentSuccessful };
            variant { PaymentFailed };
            variant { SubscriptionCancelled }
        };
        isActive = true;
        maxRetries = 3;
        timeout = 30
    }
)"

if [ $? -eq 0 ]; then
    echo "✅ Webhook configured successfully"
else
    echo "❌ Failed to configure webhook"
    kill $SERVER_PID
    exit 1
fi

# Step 4: Test webhook
echo ""
echo "🧪 Step 4: Testing webhook..."
dfx canister call subscription_manager testWebhook "(\"$PLAN_ID\")"

# Step 5: Create subscription (triggers webhook)
echo ""
echo "📝 Step 5: Creating subscription (triggers webhook)..."
SUB_RESULT=$(dfx canister call subscription_manager subscribe "(\"$PLAN_ID\")")
SUB_ID=$(echo "$SUB_RESULT" | sed -n 's/.*ok = \([0-9]*\).*/\1/p')

if [ -n "$SUB_ID" ]; then
    echo "✅ Subscription created: $SUB_ID"
else
    echo "❌ Failed to create subscription"
fi

# Step 6: Trigger payment events
echo ""
echo "💰 Step 6: Triggering payment events..."
dfx canister call subscription_manager confirmPayment "($SUB_ID : nat)"
echo "✅ Payment confirmed (webhook triggered)"

# Step 7: Check webhook events
echo ""
echo "📊 Step 7: Checking webhook events..."
dfx canister call subscription_manager getWebhookEvents "(\"$PLAN_ID\")"

# Step 8: Show analytics
echo ""
echo "📈 Step 8: Webhook analytics..."
curl -s http://localhost:3001/analytics | python3 -m json.tool 2>/dev/null || echo "Analytics available at http://localhost:3001/analytics"

echo ""
echo "🎉 Demo completed!"
echo "=================="
echo ""
echo "📊 Dashboard: http://localhost:3001"
echo "📡 Webhook URL: http://localhost:3001/webhook"
echo "🔧 Plan ID: $PLAN_ID"
echo "📝 Subscription ID: $SUB_ID"
echo ""
echo "💡 Try these commands:"
echo "   # View webhook events"
echo "   curl http://localhost:3001/events"
echo ""
echo "   # Test more events"
echo "   node webhook-tester.js"
echo ""
echo "   # Trigger more BitSub events"
echo "   dfx canister call subscription_manager confirmPayment \"($SUB_ID : nat)\""
echo ""

# Keep server running for manual testing
echo "🔄 Server will keep running for manual testing..."
echo "   Press Ctrl+C to stop the server"
echo ""

# Wait for user interrupt
trap "echo ''; echo '🛑 Stopping webhook server...'; kill $SERVER_PID; exit 0" INT
wait $SERVER_PID