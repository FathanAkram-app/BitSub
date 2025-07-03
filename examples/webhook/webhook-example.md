# Webhook Example

## Webhook URL Format
```
https://your-service.com/api/webhooks/bitsub-payment
```

## Webhook Payload (POST Request)
```json
{
  "subscriptionId": 123,
  "planId": "plan_456",
  "subscriber": "rdmx6-jaaaa-aaaaa-aaadq-cai",
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

## Example Webhook Handler (Node.js/Express)
```javascript
app.post('/api/webhooks/bitsub-payment', (req, res) => {
  const { subscriptionId, subscriber, subscriberAccount, plan } = req.body;
  
  // Create unique user account in your service
  const uniqueUsername = `user_${subscriber.slice(-8)}`;
  const userEmail = `${subscriberAccount}@temp-email.com`;
  
  // Create account in your database
  await createUserAccount({
    username: uniqueUsername,
    email: userEmail,
    planType: plan.title,
    subscriptionId: subscriptionId,
    btcAddress: subscriberAccount
  });
  
  // Send welcome email with login credentials
  await sendWelcomeEmail(userEmail, uniqueUsername);
  
  res.status(200).json({ success: true });
});
```

## Real-World Examples

### SaaS Service
```
https://myapp.com/webhooks/subscription-activated
```

### Discord Bot
```
https://discord-bot.herokuapp.com/api/bitsub/member-added
```

### Email Service
```
https://api.mailchimp.com/3.0/lists/abc123/members
```

### VPN Service
```
https://vpn-service.com/api/v1/users/activate
```