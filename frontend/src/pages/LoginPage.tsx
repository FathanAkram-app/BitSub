import React from 'react';
import { Button } from '../components/ui';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps): React.ReactElement {
  return (
    <>
      <div className="hero">
        <div className="hero-content">
          <div className="hero-badge">⚡ Powered by Internet Computer & Bitcoin</div>
          <h2 className="hero-tagline">The Future of Bitcoin Subscriptions</h2>
          <p className="hero-subtitle">Create recurring revenue streams, manage subscriptions, and get paid in Bitcoin with zero intermediaries. Built on the Internet Computer for maximum decentralization.</p>
          <div className="auth">
            <Button onClick={onLogin} variant="primary" size="lg">
              🚀 Launch App
            </Button>
            <p className="auth-note">Connect with Internet Identity - No email required</p>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">100%</div>
              <div className="stat-label">Decentralized</div>
            </div>
            <div className="stat">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Uptime</div>
            </div>
            <div className="stat">
              <div className="stat-number">∞</div>
              <div className="stat-label">Scalability</div>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose BitSub?</h2>
          <div className="features">
            <div className="feature">
              <div className="feature-icon">🎨</div>
              <h3>For Creators</h3>
              <p>Launch subscription plans in minutes. Set custom pricing, billing intervals, and webhook integrations. Track revenue with real-time analytics.</p>
              <ul>
                <li>Custom pricing & intervals</li>
                <li>Real-time analytics</li>
                <li>Webhook automation</li>
                <li>Shareable subscription links</li>
              </ul>
            </div>
            <div className="feature">
              <div className="feature-icon">💳</div>
              <h3>For Subscribers</h3>
              <p>Subscribe to your favorite creators with Bitcoin. Built-in wallet management, automatic payments, and transparent billing.</p>
              <ul>
                <li>Built-in Bitcoin wallet</li>
                <li>Automatic recurring payments</li>
                <li>Transparent billing</li>
                <li>Cancel anytime</li>
              </ul>
            </div>
            <div className="feature">
              <div className="feature-icon">🔗</div>
              <h3>Developer Friendly</h3>
              <p>Integrate BitSub into your existing services with webhooks. Automate user provisioning and access control seamlessly.</p>
              <ul>
                <li>Webhook notifications</li>
                <li>REST API access</li>
                <li>Embeddable widgets</li>
                <li>Custom integrations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="tech-section">
        <div className="container">
          <h2 className="section-title">Built on Cutting-Edge Technology</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <div className="tech-icon">🌐</div>
              <h4>Internet Computer</h4>
              <p>Fully decentralized backend with no cloud providers or servers</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon">₿</div>
              <h4>Bitcoin Integration</h4>
              <p>Native Bitcoin payments with testnet support for development</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon">🔐</div>
              <h4>Internet Identity</h4>
              <p>Secure authentication without passwords or personal data</p>
            </div>
            <div className="tech-item">
              <div className="tech-icon">📊</div>
              <h4>Real-time Analytics</h4>
              <p>Live revenue tracking with OKX price integration</p>
            </div>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Earning Bitcoin?</h2>
            <p>Join the decentralized subscription economy. No KYC, no middlemen, just pure Bitcoin payments.</p>
            <Button onClick={onLogin} variant="primary" size="lg">
              Get Started Now →
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}