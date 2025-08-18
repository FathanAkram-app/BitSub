#!/bin/bash

# BitSub Webhook Configuration Script
# This script helps configure webhooks for BitSub plans

echo "🎯 BitSub Webhook Configuration"
echo "==============================="

# Configuration
WEBHOOK_URL=${WEBHOOK_URL:-"http://localhost:3001/webhook"}
WEBHOOK_SECRET=${WEBHOOK_SECRET:-"webhook-test-secret-123"}
PLAN_ID=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --plan-id)
            PLAN_ID="$2"
            shift 2
            ;;
        --url)
            WEBHOOK_URL="$2"
            shift 2
            ;;
        --secret)
            WEBHOOK_SECRET="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 --plan-id <plan-id> [options]"
            echo ""
            echo "Options:"
            echo "  --plan-id <id>     BitSub plan ID (required)"
            echo "  --url <url>        Webhook URL (default: http://localhost:3001/webhook)"
            echo "  --secret <secret>  Webhook secret (default: webhook-test-secret-123)"
            echo "  --help, -h         Show this help"
            echo ""
            echo "Examples:"
            echo "  $0 --plan-id abc123-def456"
            echo "  $0 --plan-id abc123 --url https://mysite.com/webhook"
            echo "  $0 --plan-id abc123 --secret my-secret-key"
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$PLAN_ID" ]; then
    echo "❌ Plan ID is required. Use --plan-id <plan-id>"
    exit 1
fi

echo "📋 Configuration:"
echo "   Plan ID: $PLAN_ID"
echo "   Webhook URL: $WEBHOOK_URL"
echo "   Secret: ${WEBHOOK_SECRET:0:10}..."
echo ""

# Check if dfx is available
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx command not found. Please install DFINITY SDK first."
    exit 1
fi

echo "🔧 Configuring webhook..."

# Configure webhook
dfx canister call subscription_manager configureWebhook "(
    \"$PLAN_ID\",
    record {
        url = \"$WEBHOOK_URL\";
        secret = \"$WEBHOOK_SECRET\";
        events = vec { 
            variant { SubscriptionCreated };
            variant { PaymentSuccessful };
            variant { PaymentFailed };
            variant { SubscriptionCancelled };
            variant { SubscriptionExpired }
        };
        isActive = true;
        maxRetries = 3;
        timeout = 30
    }
)"

if [ $? -eq 0 ]; then
    echo "✅ Webhook configured successfully!"
    echo ""
    
    # Test webhook configuration
    echo "🧪 Testing webhook configuration..."
    dfx canister call subscription_manager testWebhook "(\"$PLAN_ID\")"
    
    if [ $? -eq 0 ]; then
        echo "✅ Webhook test completed!"
    else
        echo "⚠️  Webhook test failed (this may be expected if the URL is not reachable)"
    fi
    
    echo ""
    echo "📊 To view webhook events:"
    echo "   dfx canister call subscription_manager getWebhookEvents '(\"$PLAN_ID\")'"
    echo ""
    echo "📈 To get webhook statistics:"
    echo "   dfx canister call subscription_manager getWebhookRetryStats '(\"$PLAN_ID\")'"
    echo ""
    echo "🔍 To verify webhook configuration:"
    echo "   dfx canister call subscription_manager getWebhookConfig '(\"$PLAN_ID\")'"
    
else
    echo "❌ Failed to configure webhook"
    exit 1
fi