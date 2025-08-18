import React from 'react';
import { Button } from './ui';
import { NavigationProps } from '../types';

interface ExtendedNavigationProps extends NavigationProps {
  children?: React.ReactNode;
}

export default function Navigation({ 
  dashboardType, 
  onSwitchDashboard, 
  onLogout, 
  children 
}: ExtendedNavigationProps): React.ReactElement {
  return (
    <nav className="navigation" role="navigation" aria-label="Main navigation">
      <div className="nav-content">
        <div className="nav-brand">
          <button 
            onClick={() => onSwitchDashboard(null)}
            className="brand-button"
            aria-label="Go to dashboard selector"
          >
            <span className="bitcoin-icon">₿</span>
            <span className="brand-text">BitSub</span>
            <span className="brand-badge">Beta</span>
          </button>
        </div>
        
        <div className="nav-menu">
          <div className="nav-actions">
            <Button 
              onClick={() => onSwitchDashboard('creator')}
              variant={dashboardType === 'creator' ? 'primary' : 'secondary'}
              size="sm"
              aria-pressed={dashboardType === 'creator'}
            >
              🎨 Creator
            </Button>
            <Button 
              onClick={() => onSwitchDashboard('subscriber')}
              variant={dashboardType === 'subscriber' ? 'primary' : 'secondary'}
              size="sm"
              aria-pressed={dashboardType === 'subscriber'}
            >
              💳 Subscriber
            </Button>
            <Button 
              onClick={() => onSwitchDashboard('marketplace')}
              variant={dashboardType === 'marketplace' ? 'primary' : 'secondary'}
              size="sm"
              aria-pressed={dashboardType === 'marketplace'}
            >
              🛒 Marketplace
            </Button>
          </div>

          <div className="nav-user">
            {children}
            <Button 
              onClick={onLogout} 
              variant="secondary" 
              size="sm"
              className="logout-btn"
              aria-label="Sign out of BitSub"
            >
              🚪 Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}