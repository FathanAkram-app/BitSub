# BitSub Webhook Server Docker Image

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY comprehensive-webhook-server.js ./
COPY webhook-tester.js ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S webhook -u 1001

# Change ownership of the app directory
RUN chown -R webhook:nodejs /app
USER webhook

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the server
CMD ["node", "comprehensive-webhook-server.js"]