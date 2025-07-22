import React from 'react';
import { Button } from '../components/ui';

type DashboardType = 'creator' | 'subscriber' |'marketplace';

interface SelectorPageProps {
  onSelectDashboard: (dashboard: DashboardType | null) => void;
}

export default function SelectorPage({ onSelectDashboard }: SelectorPageProps): React.ReactElement {
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
          <p>Manage your active subscriptions</p>
          <ul>
            <li>View active subscriptions</li>
            <li>Manage payment methods</li>
            <li>Track payment history</li>
            <li>Cancel subscriptions</li>
          </ul>
          <Button onClick={() => onSelectDashboard('subscriber')} variant="primary">
            My Subscriptions
          </Button>
        </div>
      </div>
    </div>
  );
}