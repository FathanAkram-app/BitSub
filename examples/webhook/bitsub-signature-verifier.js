#!/usr/bin/env node

/**
 * BitSub Signature Verifier
 * 
 * This utility calls the BitSub canister to verify webhook signatures
 * since we can't replicate Motoko's Text.hash() function in JavaScript.
 */

const { execSync } = require('child_process');

class BitSubSignatureVerifier {
    constructor(options = {}) {
        this.canisterName = options.canisterName || 'subscription_manager';
        this.verbose = options.verbose || false;
    }

    /**
     * Verify webhook signature using BitSub canister
     */
    async verifySignature(payload, signature, secret) {
        try {
            const command = `dfx canister call ${this.canisterName} verifyWebhookSignature '("${payload}", "${signature}", "${secret}")'`;
            
            if (this.verbose) {
                console.log(`🔍 Verifying signature with command: ${command}`);
            }
            
            const result = execSync(command, { encoding: 'utf8' });
            const isValid = result.trim() === '(true)';
            
            if (this.verbose) {
                console.log(`🔐 Signature verification result: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
                console.log(`📝 Payload: ${payload.substring(0, 100)}...`);
                console.log(`🔑 Signature: ${signature}`);
                console.log(`🗝️  Secret: ${secret.substring(0, 10)}...`);
            }
            
            return isValid;
        } catch (error) {
            console.error(`❌ Error verifying signature: ${error.message}`);
            return false;
        }
    }

    /**
     * Test the verifier with sample data
     */
    async test() {
        console.log('🧪 Testing BitSub signature verifier...\n');
        
        const testCases = [
            {
                payload: '{"event":"subscription.created","subscriptionId":123}',
                signature: '123456789',
                secret: 'test-secret'
            },
            {
                payload: '{"event":"payment.successful","subscriptionId":456}',
                signature: '987654321',
                secret: 'webhook-test-secret-123'
            }
        ];
        
        for (let i = 0; i < testCases.length; i++) {
            const testCase = testCases[i];
            console.log(`Test ${i + 1}:`);
            
            const isValid = await this.verifySignature(
                testCase.payload,
                testCase.signature,
                testCase.secret
            );
            
            console.log(`Result: ${isValid ? '✅ Valid' : '❌ Invalid'}\n`);
        }
    }
}

// CLI interface
async function main() {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
BitSub Signature Verifier

Usage: 
  node bitsub-signature-verifier.js test                               # Run test cases
  node bitsub-signature-verifier.js verify <payload> <signature> <secret>  # Verify specific signature

Options:
  --verbose, -v    Verbose output
  --help, -h       Show this help

Examples:
  node bitsub-signature-verifier.js test
  node bitsub-signature-verifier.js verify "{\\"event\\":\\"test\\"}" "12345" "secret"
        `);
        return;
    }
    
    const verbose = args.includes('--verbose') || args.includes('-v');
    const verifier = new BitSubSignatureVerifier({ verbose });
    
    if (args[0] === 'test') {
        await verifier.test();
    } else if (args[0] === 'verify' && args.length >= 4) {
        const payload = args[1];
        const signature = args[2];
        const secret = args[3];
        
        const isValid = await verifier.verifySignature(payload, signature, secret);
        console.log(`Signature ${isValid ? 'VALID' : 'INVALID'}`);
        process.exit(isValid ? 0 : 1);
    } else {
        console.error('Invalid arguments. Use --help for usage information.');
        process.exit(1);
    }
}

// Export for use as module
module.exports = BitSubSignatureVerifier;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}