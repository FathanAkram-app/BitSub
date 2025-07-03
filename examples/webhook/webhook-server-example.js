const express = require('express');
const app = express();

// Middleware to parse JSON
app.use(express.json());

// BitSub webhook endpoint
app.post('/api/webhooks/bitsub-payment', (req, res) => {
  const { subscriptionId, subscriber, subscriberAccount, plan, payment } = req.body;
  
  console.log('🎉 New subscription payment received!');
  console.log('Subscription ID:', subscriptionId);
  console.log('Subscriber:', subscriber);
  console.log('Unique Account:', subscriberAccount);
  console.log('Plan:', plan.title);
  console.log('Amount:', plan.amount, 'sats');
  
  // Create unique user account
  const uniqueUsername = `user_${subscriber.slice(-8)}`;
  const userEmail = `${subscriberAccount.slice(-8)}@temp-email.com`;
  
  // Example: Create user in your database
  createUserAccount({
    username: uniqueUsername,
    email: userEmail,
    planType: plan.title,
    subscriptionId: subscriptionId,
    btcAddress: subscriberAccount,
    activatedAt: new Date(payment.timestamp)
  });
  
  // Example: Send welcome email
  sendWelcomeEmail(userEmail, uniqueUsername, plan.title);
  
  // Example: Add to Discord server
  if (plan.title.includes('Premium')) {
    addToDiscordRole(subscriber, 'premium-members');
  }
  
  // Respond with success
  res.status(200).json({ 
    success: true, 
    message: 'User account created successfully',
    username: uniqueUsername 
  });
});

// Mock functions (replace with your actual implementations)
function createUserAccount(userData) {
  console.log('📝 Creating user account:', userData);
  // Your database logic here
}

function sendWelcomeEmail(email, username, planType) {
  console.log('📧 Sending welcome email to:', email);
  // Your email service logic here
}

function addToDiscordRole(userId, role) {
  console.log('🎮 Adding user to Discord role:', role);
  // Your Discord bot logic here
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/api/webhooks/bitsub-payment`);
});