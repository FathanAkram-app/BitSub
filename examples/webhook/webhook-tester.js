#!/usr/bin/env node

/**
 * BitSub Webhook Testing Utility
 * 
 * This script tests webhook functionality by sending various events
 * to a webhook endpoint with proper signature verification.
 */

const crypto = require('crypto');
const https = require('https');
const http = require('http');

class WebhookTester {
    constructor(options = {}) {
        this.webhookUrl = options.webhookUrl || 'http://localhost:3001/webhook';
        this.secret = options.secret || 'webhook-test-secret-123';
        this.verbose = options.verbose || false;
        this.results = [];
    }

    /**
     * Generate BitSub-compatible signature
     * BitSub uses Motoko's Text.hash() which we can't replicate exactly,
     * so we'll generate a simple numeric signature for testing
     */
    generateSignature(payload, secret) {
        const combined = payload + "|SECRET|" + secret;
        // Generate a simple hash that looks like Motoko's Nat32.toText output
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        // Return as positive number string (like Motoko's Nat32.toText)
        return Math.abs(hash).toString();
    }

    /**
     * Create test event data
     */
    createTestEvent(eventType, overrides = {}) {
        const baseTimestamp = Date.now() * 1000000; // Convert to nanoseconds
        const subscriptionId = overrides.subscriptionId || Math.floor(Math.random() * 1000);
        const planId = overrides.planId || `test-plan-${Math.floor(Math.random() * 100)}`;

        const events = {
            'subscription.created': {
                event: 'subscription.created',
                subscriptionId,
                subscriber: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
                subscriberAccount: 'bc1qtest' + Math.floor(Math.random() * 999999),
                plan: {
                    planId,
                    title: 'Test Subscription Plan',
                    amount: 5000,
                    interval: 'monthly'
                },
                payment: null,
                signature: '', // Will be set later
                timestamp: baseTimestamp
            },

            'payment.successful': {
                event: 'payment.successful',
                subscriptionId,
                subscriber: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
                subscriberAccount: 'bc1qtest' + Math.floor(Math.random() * 999999),
                plan: {
                    planId,
                    title: 'Test Subscription Plan',
                    amount: 5000,
                    interval: 'monthly'
                },
                payment: {
                    timestamp: baseTimestamp,
                    nextPayment: baseTimestamp + (30 * 24 * 60 * 60 * 1000 * 1000000), // +30 days
                    amount: 5000,
                    status: 'confirmed'
                },
                signature: '',
                timestamp: baseTimestamp
            },

            'payment.failed': {
                event: 'payment.failed',
                subscriptionId,
                subscriber: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
                subscriberAccount: 'bc1qtest' + Math.floor(Math.random() * 999999),
                plan: {
                    planId,
                    title: 'Test Subscription Plan',
                    amount: 5000,
                    interval: 'monthly'
                },
                payment: {
                    timestamp: baseTimestamp,
                    nextPayment: baseTimestamp + (30 * 24 * 60 * 60 * 1000 * 1000000),
                    amount: 5000,
                    status: 'failed'
                },
                signature: '',
                timestamp: baseTimestamp
            },

            'subscription.cancelled': {
                event: 'subscription.cancelled',
                subscriptionId,
                subscriber: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
                subscriberAccount: 'bc1qtest' + Math.floor(Math.random() * 999999),
                plan: {
                    planId,
                    title: 'Test Subscription Plan',
                    amount: 5000,
                    interval: 'monthly'
                },
                payment: null,
                signature: '',
                timestamp: baseTimestamp
            },

            'subscription.expired': {
                event: 'subscription.expired',
                subscriptionId,
                subscriber: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
                subscriberAccount: 'bc1qtest' + Math.floor(Math.random() * 999999),
                plan: {
                    planId,
                    title: 'Test Subscription Plan',
                    amount: 5000,
                    interval: 'monthly'
                },
                payment: null,
                signature: '',
                timestamp: baseTimestamp
            }
        };

        const event = events[eventType];
        if (!event) {
            throw new Error(`Unknown event type: ${eventType}`);
        }

        // Apply overrides
        Object.assign(event, overrides);

        return event;
    }

    /**
     * Send webhook request
     */
    async sendWebhook(event) {
        return new Promise((resolve, reject) => {
            const payload = JSON.stringify(event);
            const signature = this.generateSignature(payload, this.secret);
            
            const url = new URL(this.webhookUrl);
            const isHttps = url.protocol === 'https:';
            const client = isHttps ? https : http;

            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                    'X-BitSub-Signature': signature,
                    'User-Agent': 'BitSub-Webhook-Tester/1.0'
                }
            };

            const startTime = Date.now();

            const req = client.request(options, (res) => {
                let responseBody = '';
                
                res.on('data', (chunk) => {
                    responseBody += chunk;
                });

                res.on('end', () => {
                    const duration = Date.now() - startTime;
                    
                    try {
                        const parsedBody = JSON.parse(responseBody);
                        resolve({
                            status: res.statusCode,
                            headers: res.headers,
                            body: parsedBody,
                            duration,
                            event: event.event,
                            subscriptionId: event.subscriptionId
                        });
                    } catch (e) {
                        resolve({
                            status: res.statusCode,
                            headers: res.headers,
                            body: responseBody,
                            duration,
                            event: event.event,
                            subscriptionId: event.subscriptionId
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject({
                    error: error.message,
                    event: event.event,
                    subscriptionId: event.subscriptionId
                });
            });

            req.write(payload);
            req.end();
        });
    }

    /**
     * Test single event type
     */
    async testEvent(eventType, options = {}) {
        console.log(`\n🧪 Testing ${eventType}...`);
        
        try {
            const event = this.createTestEvent(eventType, options);
            const result = await this.sendWebhook(event);
            
            this.results.push(result);
            
            if (this.verbose) {
                console.log(`📤 Sent: ${JSON.stringify(event, null, 2)}`);
            }
            
            console.log(`📥 Response: ${result.status} (${result.duration}ms)`);
            
            if (result.status >= 200 && result.status < 300) {
                console.log(`✅ ${eventType} - SUCCESS`);
                if (this.verbose && result.body) {
                    console.log(`📋 Body: ${JSON.stringify(result.body, null, 2)}`);
                }
            } else {
                console.log(`❌ ${eventType} - FAILED`);
                console.log(`💬 Error: ${JSON.stringify(result.body)}`);
            }
            
            return result;
            
        } catch (error) {
            console.log(`💥 ${eventType} - ERROR: ${error.error || error.message}`);
            this.results.push(error);
            return error;
        }
    }

    /**
     * Test signature verification (negative test)
     */
    async testInvalidSignature() {
        console.log(`\n🧪 Testing invalid signature...`);
        
        try {
            const event = this.createTestEvent('payment.successful');
            const payload = JSON.stringify(event);
            
            // Create request with invalid signature
            const url = new URL(this.webhookUrl);
            const isHttps = url.protocol === 'https:';
            const client = isHttps ? https : http;

            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(payload),
                    'X-BitSub-Signature': 'invalid-signature-12345',
                    'User-Agent': 'BitSub-Webhook-Tester/1.0'
                }
            };

            const result = await new Promise((resolve, reject) => {
                const req = client.request(options, (res) => {
                    let responseBody = '';
                    res.on('data', (chunk) => {
                        responseBody += chunk;
                    });
                    res.on('end', () => {
                        resolve({
                            status: res.statusCode,
                            body: responseBody
                        });
                    });
                });

                req.on('error', reject);
                req.write(payload);
                req.end();
            });

            if (result.status === 401) {
                console.log(`✅ Invalid signature correctly rejected`);
            } else {
                console.log(`❌ Invalid signature not rejected (status: ${result.status})`);
            }

            return result;

        } catch (error) {
            console.log(`💥 Error testing invalid signature: ${error.message}`);
            return error;
        }
    }

    /**
     * Test all event types
     */
    async testAllEvents() {
        console.log(`🎯 Starting comprehensive webhook tests...`);
        console.log(`📡 Target URL: ${this.webhookUrl}`);
        console.log(`🔐 Secret: ${this.secret}`);
        
        const eventTypes = [
            'subscription.created',
            'payment.successful',
            'payment.failed',
            'subscription.cancelled',
            'subscription.expired'
        ];

        // Test valid events
        for (const eventType of eventTypes) {
            await this.testEvent(eventType);
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        }

        // Test invalid signature
        await this.testInvalidSignature();

        // Test sequence (subscription lifecycle)
        await this.testSubscriptionLifecycle();

        this.printSummary();
    }

    /**
     * Test complete subscription lifecycle
     */
    async testSubscriptionLifecycle() {
        console.log(`\n🔄 Testing subscription lifecycle...`);
        
        const subscriptionId = Math.floor(Math.random() * 1000);
        const planId = `lifecycle-plan-${subscriptionId}`;
        
        // 1. Subscription created
        await this.testEvent('subscription.created', { subscriptionId, planId });
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 2. Multiple successful payments
        for (let i = 1; i <= 3; i++) {
            console.log(`  💰 Payment ${i}/3`);
            await this.testEvent('payment.successful', { subscriptionId, planId });
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // 3. One failed payment
        await this.testEvent('payment.failed', { subscriptionId, planId });
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 4. Recovery payment
        await this.testEvent('payment.successful', { subscriptionId, planId });
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 5. Final cancellation
        await this.testEvent('subscription.cancelled', { subscriptionId, planId });
        
        console.log(`✅ Lifecycle test completed for subscription ${subscriptionId}`);
    }

    /**
     * Print test summary
     */
    printSummary() {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📊 WEBHOOK TEST SUMMARY`);
        console.log(`${'='.repeat(60)}`);
        
        const successful = this.results.filter(r => r.status >= 200 && r.status < 300).length;
        const failed = this.results.filter(r => r.status >= 400 || r.error).length;
        const total = this.results.length;
        
        console.log(`✅ Successful: ${successful}/${total}`);
        console.log(`❌ Failed: ${failed}/${total}`);
        console.log(`⏱️  Average response time: ${this.getAverageResponseTime()}ms`);
        
        if (failed > 0) {
            console.log(`\n💥 Failed requests:`);
            this.results.filter(r => r.status >= 400 || r.error).forEach((result, i) => {
                console.log(`   ${i + 1}. ${result.event || 'unknown'}: ${result.error || result.status}`);
            });
        }
        
        console.log(`\n🎯 Test completed at ${new Date().toISOString()}`);
        console.log(`${'='.repeat(60)}\n`);
    }

    /**
     * Calculate average response time
     */
    getAverageResponseTime() {
        const durations = this.results.filter(r => r.duration).map(r => r.duration);
        if (durations.length === 0) return 0;
        return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--url':
                options.webhookUrl = args[++i];
                break;
            case '--secret':
                options.secret = args[++i];
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--help':
            case '-h':
                console.log(`
BitSub Webhook Tester

Usage: node webhook-tester.js [options] [event-type]

Options:
  --url <url>       Webhook URL (default: http://localhost:3001/webhook)
  --secret <secret> Webhook secret (default: webhook-test-secret-123)
  --verbose, -v     Verbose output
  --help, -h        Show this help

Event Types:
  subscription.created
  payment.successful
  payment.failed
  subscription.cancelled
  subscription.expired
  all                Run all tests (default)
  lifecycle          Test subscription lifecycle

Examples:
  node webhook-tester.js
  node webhook-tester.js payment.successful
  node webhook-tester.js --url https://mysite.com/webhook all
  node webhook-tester.js --verbose lifecycle
                `);
                return;
        }
    }
    
    const tester = new WebhookTester(options);
    const eventType = args.find(arg => !arg.startsWith('--')) || 'all';
    
    console.log(`🎯 BitSub Webhook Tester`);
    console.log(`📅 ${new Date().toISOString()}\n`);
    
    if (eventType === 'all') {
        await tester.testAllEvents();
    } else if (eventType === 'lifecycle') {
        await tester.testSubscriptionLifecycle();
        tester.printSummary();
    } else {
        await tester.testEvent(eventType);
        tester.printSummary();
    }
}

// Export for use as module
module.exports = WebhookTester;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}