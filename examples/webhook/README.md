# BitSub Examples

This directory contains example implementations and documentation for integrating with BitSub.

## 📁 Files

### Webhook Integration
- **`webhook-example.md`** - Webhook payload examples and use cases
- **`webhook-server-example.js`** - Complete Express.js webhook server
- **`package.json`** - Dependencies for webhook server
- **`README-webhook.md`** - Webhook server setup guide

## 🚀 Quick Start

### Run Webhook Server Example
```bash
cd examples
npm install
npm start
```

### Webhook URL
```
http://localhost:3000/api/webhooks/bitsub-payment
```

## 💡 Integration Examples

The webhook server shows how to:
- Handle BitSub payment notifications
- Create unique user accounts per subscriber
- Integrate with email services
- Add users to Discord roles
- Log subscription activity

## 🔗 Use in Production

Replace mock functions with your actual services:
- Database integration
- Email providers (SendGrid, Mailgun)
- Discord/Slack bots
- User management systems