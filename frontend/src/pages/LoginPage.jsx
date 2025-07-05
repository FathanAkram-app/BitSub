import { Button } from '../components/ui'

export default function LoginButton({ onLogin }) {
  return (
    <div className="hero">
      <div className="hero-content">
        <h1>Bitcoin Subscription Platform</h1>
        <p className="hero-subtitle">Create recurring revenue streams or subscribe to services using Bitcoin</p>
        
        <div className="auth">
          <h2>Get Started</h2>
          <p>Connect your Internet Identity to access the platform</p>
          <Button onClick={onLogin} variant="primary" size="large">
            🔐 Connect Identity
          </Button>
        </div>
        
        <div className="features">
          <div className="feature">
            <div className="feature-icon">🎨</div>
            <h3>For Creators</h3>
            <p>Set up subscription plans with custom pricing and intervals</p>
          </div>
          <div className="feature">
            <div className="feature-icon">💳</div>
            <h3>For Subscribers</h3>
            <p>Pay with Bitcoin for seamless recurring subscriptions</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🔗</div>
            <h3>Webhook Integration</h3>
            <p>Automate user provisioning with webhook notifications</p>
          </div>
        </div>
      </div>
    </div>
  )
}