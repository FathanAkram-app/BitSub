# BitSub - Bitcoin Subscription Platform

A decentralized subscription platform built on the Internet Computer, enabling Bitcoin-powered recurring payments with automatic wallet management, real-time analytics, and webhook integrations.

## 🚀 Features

### 💰 Wallet System
- **Integrated Wallet** - Built-in Bitcoin testnet wallet for users
- **Automatic Payments** - Subscriptions auto-pay from wallet balance
- **Real Balance Tracking** - Live wallet balance updates
- **Instant Transactions** - No waiting for Bitcoin confirmations

### 📊 Analytics & Insights
- **Interactive Charts** - Daily, Monthly, Yearly revenue visualization
- **Real-time Data** - Live transaction and subscription analytics
- **Creator Insights** - Plan performance and subscriber metrics
- **Transaction History** - Complete payment tracking

### 🎯 Subscription Management
- **Creator Dashboard** - Create, edit, and delete subscription plans
- **Subscriber Dashboard** - Subscribe, manage, and cancel subscriptions
- **Payment Status** - Visual indicators for paid/overdue subscriptions
- **Flexible Intervals** - Daily, Weekly, Monthly, Yearly billing

### 🔄 Automation
- **Payment Processor** - Background service for automatic recurring payments
- **Webhook Integration** - Automate user provisioning and notifications
- **Smart Scheduling** - Automatic payment date advancement
- **Balance Validation** - Only processes payments when funds available

### 🟠 OKX DEX API Integration
- **Real-time Price Data** - Direct integration with OKX DEX API
- **API Endpoint** - `GET https://www.okx.com/api/v5/market/ticker?instId=BTC-USDT`
- **HTTP Outcalls** - Backend canisters make direct API calls to OKX
- **Live USD Conversions** - All Bitcoin amounts converted using OKX prices
- **Price Widget** - Live BTC/USDT price display with OKX branding
- **Automatic Updates** - Price refreshes every 5 seconds

## 🏗️ Architecture

```
BitSub-api/
├── backend/                    # Motoko canisters
│   ├── subscription_manager/   # Core subscription logic
│   ├── wallet_manager/        # Bitcoin wallet management
│   ├── transaction_log/       # Payment tracking
│   ├── bitcoin_integration/   # Bitcoin network integration
│   ├── bitcoin_testnet/      # Testnet utilities
│   └── payment_processor/    # Automatic payment processing
├── frontend/                  # React application
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SubscriberDashboard.jsx
│   │   │   ├── TransactionHistory.jsx
│   │   │   ├── CreatorInsights.jsx
│   │   │   ├── WalletBalance.jsx
│   │   │   └── PaymentProcessor.jsx
│   │   └── declarations/     # Generated Candid files
│   └── dist/
└── examples/                 # Integration examples
    ├── webhook-server-example.js
    └── webhook-example.md
```

## 🛠️ Development

### Prerequisites
- [DFX](https://internetcomputer.org/docs/current/developer-docs/setup/install/) (Internet Computer SDK)
- [Node.js](https://nodejs.org/) (v16+)

### Setup
```bash
# Clone repository
git clone <repository-url>
cd BitSub

# One-command setup (installs, deploys, builds everything)
./scripts/auto-deploy.sh
```

### Access Application
- **Frontend**: http://127.0.0.1:4943/?canisterId=be2us-64aaa-aaaaa-qaabq-cai
- **Authentication**: Uses mainnet Internet Identity
- **Backend APIs**: Available via Candid interface
- **Payment Processor**: Runs automatically in background

## 📡 Webhook Integration

See `examples/` directory for complete webhook server implementation.

### Webhook URL Format
```
https://your-service.com/api/webhooks/bitsub-payment
```

### Payload Structure
```json
{
  "subscriptionId": 123,
  "subscriber": "principal-id",
  "subscriberAccount": "unique-btc-address",
  "plan": {
    "title": "Plan Name",
    "amount": 50000,
    "interval": "Monthly"
  },
  "payment": {
    "timestamp": 1703123456789,
    "nextPayment": 1705801856789
  }
}
```

## 🎯 Usage

### For Creators
1. **Login** with Internet Identity
2. **Choose** "Creator Dashboard"
3. **Create Plans** - Set title, description, amount, interval
4. **Set Webhook** URL (optional for automation)
5. **Monitor Analytics** - View revenue charts and insights
6. **Track Payments** - See real-time transaction history
7. **Manage Plans** - Edit or delete existing plans

### For Subscribers
1. **Login** with Internet Identity
2. **Choose** "Subscriber Dashboard"
3. **Add Funds** - Deposit Bitcoin testnet to wallet
4. **Find Plans** - Enter plan ID from creator
5. **Subscribe** - Automatic payment from wallet balance
6. **Monitor Status** - View payment status and next due date
7. **Manage Subscriptions** - Cancel or advance billing periods

### Automatic Features
- **Auto-Payment** - Subscriptions pay automatically when due
- **Balance Checking** - Only pays if sufficient wallet funds
- **Status Updates** - Real-time payment status indicators
- **Background Processing** - Payment processor runs every 60 seconds

## 🔧 Configuration

### Environment Variables
- `DFX_NETWORK` - Network to deploy to (local/ic)
- `CANISTER_ID_*` - Canister IDs for different environments

### Canister IDs (Current Deployment)
- `subscription_manager` - b77ix-eeaaa-aaaaa-qaada-cai
- `wallet_manager` - avqkn-guaaa-aaaaa-qaaea-cai
- `transaction_log` - by6od-j4aaa-aaaaa-qaadq-cai
- `bitcoin_integration` - bkyz2-fmaaa-aaaaa-qaaaq-cai
- `bitcoin_testnet` - bd3sg-teaaa-aaaaa-qaaba-cai
- `payment_processor` - bw4dl-smaaa-aaaaa-qaacq-cai
- `okx_integration` - br5f7-7uaaa-aaaaa-qaaca-cai
- `bitsub_frontend` - be2us-64aaa-aaaaa-qaabq-cai
- `internet_identity` - Uses mainnet (https://identity.ic0.app)

## 📚 Key Components

### Backend Canisters
- **SubscriptionManager** - Plan creation, subscription management, analytics
- **WalletManager** - Bitcoin testnet wallet, balance management
- **PaymentProcessor** - Automatic recurring payment processing
- **TransactionLog** - Payment history and transaction tracking
- **BitcoinIntegration** - Bitcoin network communication

### Frontend Components
- **Dashboard** - Creator plan management and analytics
- **SubscriberDashboard** - Subscription management and wallet
- **TransactionHistory** - Interactive revenue charts and payment history
- **CreatorInsights** - Plan performance and growth metrics
- **WalletBalance** - Bitcoin testnet wallet management
- **PaymentProcessor** - Background payment automation status

### Features
- **Real-time Analytics** - Live charts with daily/monthly/yearly views
- **Automatic Payments** - Background processing of recurring subscriptions
- **Wallet Integration** - Built-in Bitcoin testnet wallet system
- **Payment Status** - Visual indicators for subscription payment status
- **Plan Management** - Complete CRUD operations for subscription plans
- **Transaction Tracking** - Comprehensive payment and subscription logging

## 🚀 Quick Start

```bash
# One-command setup (auto-configures everything)
./scripts/auto-deploy.sh

# Opens automatically or visit:
# http://127.0.0.1:4943/?canisterId=be2us-64aaa-aaaaa-qaabq-cai
```

## 🧪 Testing

1. **Access**: http://127.0.0.1:4943/?canisterId=be2us-64aaa-aaaaa-qaabq-cai
2. **Login** with Internet Identity (mainnet)
3. **Choose Dashboard**: Creator or Subscriber
4. **Create Plans** as creator (e.g., "Premium Plan", 50000 sats/month)
5. **Add Testnet Funds** to wallet (100000+ sats recommended)
6. **Subscribe** to plans using plan IDs
7. **View Analytics** - Charts update with real payment data
8. **Test Automation** - Payment processor handles recurring payments

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test locally with `dfx start`
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details