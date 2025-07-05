import { Button } from '../components/ui'

export default function DashboardSelector({ onSelectDashboard }) {
  return (
    <div className="dashboard-selector">
      <div className="selector-header">
        <h2>Choose Your Dashboard</h2>
        <p>Select whether you want to create plans or subscribe to existing ones</p>
      </div>
      
      <div className="selector-options">
        <div className="selector-card creator-card">
          <div className="card-icon">🎨</div>
          <h3>Creator Dashboard</h3>
          <p>Create and manage subscription plans</p>
          <ul>
            <li>Create subscription plans</li>
            <li>Set pricing and intervals</li>
            <li>Configure webhooks</li>
            <li>Track subscribers</li>
          </ul>
          <Button onClick={() => onSelectDashboard('creator')} variant="primary">
            Create Plans
          </Button>
        </div>
        
        <div className="selector-card subscriber-card">
          <div className="card-icon">💳</div>
          <h3>Subscriber Dashboard</h3>
          <p>Browse and subscribe to plans</p>
          <ul>
            <li>Browse available plans</li>
            <li>Subscribe with Bitcoin</li>
            <li>Manage subscriptions</li>
            <li>View payment history</li>
          </ul>
          <Button onClick={() => onSelectDashboard('subscriber')} variant="primary">
            Subscribe to Plans
          </Button>
        </div>
      </div>
    </div>
  )
}