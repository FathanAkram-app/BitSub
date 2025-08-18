# BitSub Webhook Examples

This directory contains comprehensive examples for integrating with BitSub webhooks, including a complete webhook server implementation and testing utilities.

## 📁 Files

- **`comprehensive-webhook-server.js`** - Full-featured webhook server with all event handlers
- **`webhook-tester.js`** - Testing utility to validate webhook functionality
- **`package.json`** - Dependencies and scripts
- **`README.md`** - This documentation

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd examples/webhook
npm install
```

### 2. Start the Webhook Server

```bash
npm start
```

The server will start on `http://localhost:3001` with a web dashboard.

### 3. Test Webhooks

In another terminal:

```bash
npm run test
```

## 🎯 Webhook Server Features

### Event Handlers
- ✅ **subscription.created** - New subscription activated
- ✅ **payment.successful** - Payment processed successfully  
- ✅ **payment.failed** - Payment processing failed
- ✅ **subscription.cancelled** - Subscription cancelled by user
- ✅ **subscription.expired** - Subscription expired due to non-payment

### Security Features
- 🔐 **HMAC Signature Verification** - Validates webhook authenticity
- 🛡️ **Request Validation** - Rejects malformed or invalid requests
- 📊 **Event Logging** - Comprehensive logging for debugging

### Analytics & Monitoring
- 📈 **Real-time Statistics** - Event counts and success rates
- 📋 **Event Log** - Detailed log of all webhook events
- 🎯 **Dashboard** - Web interface for monitoring
- 🧪 **Test Endpoints** - Built-in testing capabilities

## 🔧 Configuration

### Environment Variables

```bash
# Webhook server port (default: 3001)
PORT=3001

# Webhook secret for signature verification
WEBHOOK_SECRET=your-webhook-secret-here
```

### BitSub Integration

1. **Configure webhook in BitSub:**
   ```bash
   dfx canister call subscription_manager configureWebhook '(
     "your-plan-id",
     record {
       url = "https://your-domain.com/webhook";
       secret = "your-webhook-secret";
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
   )'
   ```

2. **Test webhook configuration:**
   ```bash
   dfx canister call subscription_manager testWebhook '("your-plan-id")'
   ```

## 📡 API Endpoints

### Webhook Endpoint
```
POST /webhook
```
Main webhook endpoint that receives events from BitSub.

**Headers:**
- `Content-Type: application/json`
- `X-BitSub-Signature: <hmac-signature>`

**Example Event:**
```json
{
  "event": "payment.successful",
  "subscriptionId": 123,
  "subscriber": "rdmx6-jaaaa-aaaah-qcaiq-cai",
  "subscriberAccount": "bc1qtest123",
  "plan": {
    "planId": "plan-id-123",
    "title": "Premium Plan",
    "amount": 5000,
    "interval": "monthly"
  },
  "payment": {
    "timestamp": 1640995200000000000,
    "nextPayment": 1643673600000000000,
    "amount": 5000,
    "status": "confirmed"
  },
  "signature": "sha256=abc123...",
  "timestamp": 1640995200000000000
}
```

### Analytics Endpoints

#### GET /analytics
Returns webhook statistics and recent events.

```json
{
  "statistics": {
    "total_events": 150,
    "subscription_created": 25,
    "payment_successful": 100,
    "payment_failed": 15,
    "subscription_cancelled": 8,
    "subscription_expired": 2,
    "failed_verifications": 3
  },
  "recentEvents": [...],
  "uptime": 3600
}
```

#### GET /events
Returns filtered event log.

**Query Parameters:**
- `limit` - Number of events to return (default: 50)
- `type` - Filter by event type
- `valid` - Filter by signature validity (true/false)

#### GET /health
Health check endpoint.

```json
{
  "status": "healthy",
  "uptime": 3600,
  "events_processed": 150,
  "webhook_secret_configured": true
}
```

## 🧪 Testing

### Using the Webhook Tester

```bash
# Test all event types
node webhook-tester.js

# Test specific event
node webhook-tester.js payment.successful

# Test with custom URL
node webhook-tester.js --url https://mysite.com/webhook all

# Test subscription lifecycle
node webhook-tester.js lifecycle

# Verbose output
node webhook-tester.js --verbose all
```

### Manual Testing

```bash
# Test individual events via server endpoints
curl -X POST http://localhost:3001/test/subscription.created
curl -X POST http://localhost:3001/test/payment.successful
curl -X POST http://localhost:3001/test/payment.failed
```

## 🔐 Signature Verification

BitSub uses HMAC-SHA256 for webhook signature verification:

```javascript
function verifyWebhookSignature(payload, signature, secret) {
    const combined = payload + "|SECRET|" + secret;
    const expectedSignature = crypto
        .createHash('sha256')
        .update(combined)
        .digest('hex');
    
    return signature === expectedSignature;
}
```

**Important:** Always verify webhook signatures in production to ensure authenticity.

## 🌐 Production Deployment

### Using ngrok for Development

```bash
# Install ngrok globally
npm install -g ngrok

# Start webhook server
npm start

# In another terminal, expose local server
ngrok http 3001
```

Use the ngrok URL (e.g., `https://abc123.ngrok.io/webhook`) in your BitSub webhook configuration.

### Production Deployment Options

1. **Heroku**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   heroku create your-app-name
   git push heroku main
   ```

2. **Railway**
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Vercel**
   ```bash
   vercel
   ```

4. **Traditional VPS**
   ```bash
   # Install PM2 for process management
   npm install -g pm2
   
   # Start webhook server
   pm2 start comprehensive-webhook-server.js --name bitsub-webhook
   
   # Configure nginx reverse proxy
   # Setup SSL certificate with Let's Encrypt
   ```

## 📋 Event Handler Examples

### Subscription Created Handler
```javascript
function handleSubscriptionCreated(event) {
    // Business logic examples:
    // - Send welcome email
    // - Provision user access
    // - Update CRM/database
    // - Set up user account
    
    console.log(`New subscriber: ${event.subscriber}`);
    console.log(`Plan: ${event.plan.title}`);
    
    // Example: Send welcome email
    // await sendWelcomeEmail(event.subscriber, event.plan);
    
    // Example: Provision access
    // await provisionUserAccess(event.subscriber, event.plan.planId);
    
    return {
        status: 'processed',
        action: 'subscription_activated'
    };
}
```

### Payment Successful Handler
```javascript
function handlePaymentSuccessful(event) {
    // Business logic examples:
    // - Extend subscription period
    // - Send payment receipt
    // - Update billing records
    // - Trigger delivery/fulfillment
    
    console.log(`Payment received: ${event.payment.amount} sats`);
    
    // Example: Update subscription end date
    // await extendSubscription(
    //     event.subscriptionId, 
    //     event.payment.nextPayment
    // );
    
    // Example: Send receipt
    // await sendPaymentReceipt(event.subscriber, event.payment);
    
    return {
        status: 'processed',
        action: 'payment_recorded'
    };
}
```

### Payment Failed Handler
```javascript
function handlePaymentFailed(event) {
    // Business logic examples:
    // - Send payment failure notification
    // - Implement dunning management
    // - Downgrade service access
    // - Schedule payment retry
    
    console.log(`Payment failed for subscription: ${event.subscriptionId}`);
    
    // Example: Send dunning email
    // await sendDunningEmail(event.subscriber, event.plan);
    
    // Example: Implement grace period logic
    // await implementGracePeriod(event.subscriptionId);
    
    return {
        status: 'processed',
        action: 'dunning_initiated'
    };
}
```

## 🛠️ Advanced Usage

### Custom Event Processing

```javascript
// Add custom validation
app.use('/webhook', (req, res, next) => {
    // Custom rate limiting
    // IP whitelisting
    // Additional security checks
    next();
});

// Add event transformation
function transformEvent(event) {
    // Normalize data format
    // Add computed fields
    // Enrich with external data
    return enhancedEvent;
}
```

### Database Integration

```javascript
// Example with MongoDB
const mongoose = require('mongoose');

const WebhookEvent = new mongoose.Schema({
    eventType: String,
    subscriptionId: Number,
    subscriber: String,
    planId: String,
    timestamp: Date,
    processed: Boolean,
    result: Object
});

async function logEventToDatabase(event) {
    const webhookEvent = new WebhookEvent({
        eventType: event.event,
        subscriptionId: event.subscriptionId,
        subscriber: event.subscriber,
        planId: event.plan.planId,
        timestamp: new Date(event.timestamp / 1000000),
        processed: true,
        result: result
    });
    
    await webhookEvent.save();
}
```

### Queue Integration

```javascript
// Example with Bull Queue
const Queue = require('bull');
const webhookQueue = new Queue('webhook processing');

// Add webhook events to queue for processing
webhookQueue.add('process-webhook', event);

// Process webhooks asynchronously
webhookQueue.process('process-webhook', async (job) => {
    const event = job.data;
    return await processWebhookEvent(event);
});
```

## 🔍 Troubleshooting

### Common Issues

1. **Signature Verification Failing**
   - Check webhook secret matches BitSub configuration
   - Verify payload is not modified before verification
   - Ensure proper encoding (UTF-8)

2. **Events Not Received**
   - Verify webhook URL is accessible from internet
   - Check firewall and security group settings
   - Confirm webhook is enabled in BitSub plan

3. **Server Timeouts**
   - Keep webhook handlers lightweight
   - Use queues for heavy processing
   - Respond quickly (< 30 seconds)

### Debug Mode

```bash
# Enable verbose logging
DEBUG=* npm start

# Or set environment variable
export DEBUG=webhook:*
npm start
```

### Testing Connectivity

```bash
# Test webhook endpoint is reachable
curl -X POST https://your-domain.com/webhook \
  -H "Content-Type: application/json" \
  -H "X-BitSub-Signature: test" \
  -d '{"test": true}'

# Should return 401 (signature verification failure)
```

## 📚 Additional Resources

- [BitSub Documentation](https://docs.bitsub.com)
- [Webhook Best Practices](https://webhooks.fyi)
- [HMAC Security Guide](https://auth0.com/blog/a-look-at-the-draft-ietf-http-message-signatures/)
- [Express.js Documentation](https://expressjs.com/)

## 🆘 Support

If you encounter issues or have questions:

1. Check the [troubleshooting section](#-troubleshooting)
2. Review webhook event logs via `/analytics` endpoint
3. Test with the included webhook tester utility
4. Open an issue in the BitSub repository

## 📄 License

This example code is provided under the MIT License.