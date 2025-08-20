import React from 'react';
import { Button } from './ui';
import { NavigationProps } from '../types';
import { WalletBalance } from './WalletBalance';
import { AuthClient } from '@dfinity/auth-client';

interface ExtendedNavigationProps extends NavigationProps {
  children?: React.ReactNode;
  authClient?: AuthClient;
}

export default function Navigation({ 
  dashboardType, 
  onSwitchDashboard, 
  onLogout, 
  children,
  authClient
}: ExtendedNavigationProps): React.ReactElement {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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

        {/* Desktop Menu */}
        <div className="nav-menu nav-menu--desktop">
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
            {authClient && (
              <WalletBalance 
                authClient={authClient}
                variant="header"
                showActions={true}
              />
            )}
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

        {/* Mobile Hamburger */}
        <div className="nav-mobile">
          {authClient && (
            <WalletBalance 
              authClient={authClient}
              variant="header"
              showActions={true}
            />
          )}
          <button 
            className="hamburger-btn"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-overlay" onClick={toggleMobileMenu}>
            <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
              <div className="mobile-menu-actions">
                <Button 
                  onClick={() => {
                    onSwitchDashboard('creator');
                    setIsMobileMenuOpen(false);
                  }}
                  variant={dashboardType === 'creator' ? 'primary' : 'secondary'}
                  className="mobile-menu-btn"
                >
                  🎨 Creator Dashboard
                </Button>
                <Button 
                  onClick={() => {
                    onSwitchDashboard('subscriber');
                    setIsMobileMenuOpen(false);
                  }}
                  variant={dashboardType === 'subscriber' ? 'primary' : 'secondary'}
                  className="mobile-menu-btn"
                >
                  💳 Subscriber Dashboard
                </Button>
                <Button 
                  onClick={() => {
                    onSwitchDashboard('marketplace');
                    setIsMobileMenuOpen(false);
                  }}
                  variant={dashboardType === 'marketplace' ? 'primary' : 'secondary'}
                  className="mobile-menu-btn"
                >
                  🛒 Marketplace
                </Button>
              </div>
              
              <div className="mobile-menu-user">
                {children}
                <Button 
                  onClick={() => {
                    onLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  variant="secondary"
                  className="mobile-menu-btn logout-btn"
                >
                  🚪 Logout
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}