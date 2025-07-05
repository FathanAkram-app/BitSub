# BitSub Webhook Server Example

## Quick Start

```bash
# Install dependencies
npm install

# Run server
npm start

# Or run with auto-reload
npm run dev
```

## Webhook URL
```
http://localhost:3000/api/webhooks/bitsub-payment
```

## Payload Example
When a subscriber pays, BitSub sends this payload:

```json
{
  "subscriptionId": 123,
  "subscriber": "example",
  "subscriberAccount": "bc1q123456789abcdef",
  "plan": {
    "title": "Premium Plan",
    "description": "Access to premium features",
    "amount": 50000,
    "interval": "Monthly",
    "creator": "bkyz2-fmaaa-aaaaa-qaaaq-cai"
  },
  "payment": {
    "timestamp": 1703123456789,
    "nextPayment": 1705801856789
  }
}
```

## What This Example Does

1. **Creates unique user accounts** - Based on subscriber ID
2. **Sends welcome emails** - To generated email addresses
3. **Discord integration** - Adds premium users to Discord roles
4. **Database logging** - Stores subscription data

## Customization

Replace the mock functions with your actual services:

- `createUserAccount()` - Your user database
- `sendWelcomeEmail()` - Your email service (SendGrid, etc.)
- `addToDiscordRole()` - Your Discord bot integration

## Production Deployment

Deploy to:
- **Heroku**: `https://your-app.herokuapp.com/api/webhooks/bitsub-payment`
- **Vercel**: `https://your-app.vercel.app/api/webhooks/bitsub-payment`
- **Railway**: `https://your-app.railway.app/api/webhooks/bitsub-payment`

## Testing

Use the health check endpoint:
```
GET http://localhost:3000/health
```