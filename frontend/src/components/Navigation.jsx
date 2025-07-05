import { Button } from './ui'

export default function Navigation({ dashboardType, onSwitchDashboard, onLogout }) {
  return (
    <nav className="navigation">
      <div className="nav-content">
        <div className="nav-brand">
          <h2>₿ BitSub</h2>
        </div>
        
        <div className="nav-actions">
          <Button 
            onClick={() => onSwitchDashboard(dashboardType === 'creator' ? 'subscriber' : 'creator')}
            variant="secondary"
            className="nav-switch"
          >
            {dashboardType === 'creator' ? '💳 Switch to Subscriber' : '🎨 Switch to Creator'}
          </Button>
          <Button onClick={onLogout} variant="secondary">
            Logout
          </Button>
        </div>
      </div>
    </nav>
  )
}