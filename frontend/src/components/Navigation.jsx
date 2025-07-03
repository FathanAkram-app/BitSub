export default function Navigation({ dashboardType, onSwitchDashboard, onLogout }) {
  return (
    <nav className="navigation">
      <div className="nav-content">
        <div className="nav-brand">
          <h2>₿ BitSub</h2>
        </div>
        
        <div className="nav-actions">
          <button 
            onClick={() => onSwitchDashboard(dashboardType === 'creator' ? 'subscriber' : 'creator')}
            className="btn-secondary nav-switch"
          >
            {dashboardType === 'creator' ? '💳 Switch to Subscriber' : '🎨 Switch to Creator'}
          </button>
          <button onClick={onLogout} className="btn-secondary">
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}