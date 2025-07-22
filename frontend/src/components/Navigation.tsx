import React from 'react';
import { Button } from './ui';
import { NavigationProps } from '../types';

export default function Navigation({ dashboardType, onSwitchDashboard, onLogout }: NavigationProps): React.ReactElement {
  return (
    <nav className="navigation">
      <div className="nav-content">
        <div className="nav-brand">
          <h2>₿ BitSub</h2>
        </div>
        
        <div className="nav-actions">
          <Button 
            onClick={() => onSwitchDashboard('creator')}
            variant={dashboardType === 'creator' ? 'primary' : 'secondary'}
          >
            🎨 Creator
          </Button>
          <Button 
            onClick={() => onSwitchDashboard('subscriber')}
            variant={dashboardType === 'subscriber' ? 'primary' : 'secondary'}
          >
            💳 Subscriber
          </Button>
          <Button 
            onClick={() => onSwitchDashboard('marketplace')}
            variant={dashboardType === 'marketplace' ? 'primary' : 'secondary'}
          >
            🛒 Marketplace
          </Button>
          <Button onClick={onLogout} variant="secondary">
            Logout
          </Button>
        </div>
      </div>
    </nav>
  );
}