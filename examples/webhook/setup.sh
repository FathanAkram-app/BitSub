#!/bin/bash

# BitSub Webhook Server Setup Script

echo "🎯 BitSub Webhook Server Setup"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Make scripts executable
chmod +x comprehensive-webhook-server.js
chmod +x webhook-tester.js

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# BitSub Webhook Server Configuration
PORT=3001
WEBHOOK_SECRET=webhook-test-secret-123

# Development settings
NODE_ENV=development
DEBUG=webhook:*
EOF
    echo "✅ .env file created"
else
    echo "⚠️  .env file already exists"
fi

# Display setup completion message
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "🚀 To start the webhook server:"
echo "   npm start"
echo ""
echo "🧪 To run tests:"
echo "   npm test"
echo ""
echo "📊 Dashboard will be available at:"
echo "   http://localhost:3001"
echo ""
echo "📡 Webhook endpoint:"
echo "   http://localhost:3001/webhook"
echo ""
echo "🔐 Default webhook secret:"
echo "   webhook-test-secret-123"
echo ""
echo "📚 For more information, see README.md"
echo ""

# Optional: Install development tools
echo "🛠️  Would you like to install development tools? (ngrok, nodemon) [y/N]"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    echo "📦 Installing development tools..."
    npm install -g nodemon ngrok
    
    if [ $? -eq 0 ]; then
        echo "✅ Development tools installed"
        echo ""
        echo "📈 Additional commands available:"
        echo "   npm run dev     - Start with auto-reload"
        echo "   npm run ngrok   - Expose local server publicly"
    else
        echo "⚠️  Failed to install development tools (you may need sudo)"
    fi
fi

echo ""
echo "🎯 Ready to test BitSub webhooks!"