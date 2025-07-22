import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useWallet } from '../hooks/useWallet';
import { usePrice } from '../hooks/usePrice';
import { subscriptionService } from '../services/subscriptionService';
import { Button, Card, CardContent, Loading, EmptyState, Input } from '../components/ui';
import { formatSats, getIntervalText, formatDate } from '../utils/helpers';
import Wallet from '../components/Wallet';

interface SubscriberDashboardProps {
  authClient: AuthClient;
  onSwitchToMarketplace: () => void;
}

export default function SubscriberDashboard({ authClient, onSwitchToMarketplace }: SubscriberDashboardProps): React.ReactElement {
  const [planId, setPlanId] = useState<string>('');
  const [planDetails, setPlanDetails] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { subscriptions, refetch } = useSubscriptions(authClient);
  const { balance } = useWallet(authClient);
  const { convertSatsToUSD } = usePrice(authClient);

  useEffect(() => {
    // Check URL for subscribe or popup parameter
    const urlParams = new URLSearchParams(window.location.search)
    const subscribeParam = urlParams.get('subscribe') || urlParams.get('popup')
    
    if (subscribeParam && !planId) {
      setPlanId(subscribeParam)
      // Auto-lookup the plan
      setTimeout(() => {
        if (authClient) {
          lookupPlanById(subscribeParam)
        }
      }, 500)
    }
  }, [authClient, planId])

  const lookupPlanById = async (id: string): Promise<void> => {
    if (!id.trim()) return;
    setLoading(true);
    try {
      const result = await subscriptionService.getPlan(authClient, id);
      setPlanDetails(result.length > 0 ? result[0] : null);
    } catch (error) {
      console.error('Failed to lookup plan:', error);
    }
    setLoading(false);
  };

  const lookupPlan = async (): Promise<void> => {
    await lookupPlanById(planId);
  };

  const subscribe = async (): Promise<void> => {
    const result = await subscriptionService.subscribe(authClient, planDetails.planId);
    if ('ok' in result) {
      setPlanDetails(null);
      setPlanId('');
      refetch();
    }
  };

  const cancelSubscription = async (id: number): Promise<void> => {
    if (confirm('Cancel this subscription?')) {
      await subscriptionService.cancelSubscription(authClient, id);
      refetch();
    }
  };

  const getPaymentStatus = (sub: any): { text: string; color: string } => {
    const nextPayment = Number(sub.nextPayment) / 1000000;
    const now = Date.now();
    const overdue = nextPayment <= now;
    const hasPaid = sub.lastPayment.length > 0;
    
    if (overdue && balance < sub.planAmount) return { text: 'Insufficient Balance', color: '#ff6b6b' };
    if (overdue) return { text: 'Payment Overdue', color: '#ff6b6b' };
    if (hasPaid) return { text: 'Paid', color: '#00ff88' };
    return { text: 'Pending', color: '#ffc107' };
  };

  const retryPayment = async (subscriptionId: number): Promise<void> => {
    try {
      const result = await subscriptionService.retryPayment(authClient, subscriptionId);
      if (result) {
        refetch();
      } else {
        alert('Payment failed: Insufficient funds in wallet');
      }
    } catch (error) {
      console.error('Failed to retry payment:', error);
      alert('Payment failed: Please check your wallet balance');
    }
  };

  return (
    <div className="subscriber-dashboard">
      
      {/* Dashboard Header */}
      <div className="subscriber-header">
        <div className="header-content">
          <div className="header-main">
            <div className="header-badge">💳 My Dashboard</div>
            <h1>📊 Subscription Management</h1>
            <p>Manage your active subscriptions and wallet</p>
          </div>
          
          {/* Quick Actions */}
          <div className="quick-actions">
            <Button onClick={onSwitchToMarketplace} variant="primary">
              🛒 Browse Marketplace
            </Button>
          </div>
        </div>
      </div>

      {/* Wallet Section */}
      <div className="wallet-section">
        <Wallet authClient={authClient} />
      </div>

      {/* Main Content */}
      <div className="subscriber-content">
        {/* Subscriptions Overview */}
        <div className="subscriptions-overview">
          <div className="overview-header">
            <h2>My Subscriptions</h2>
            <div className="subscription-stats">
              <div className="stat-badge active">
                <span className="stat-number">{subscriptions.filter(s => getPaymentStatus(s).text === 'Paid').length}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-badge pending">
                <span className="stat-number">{subscriptions.filter(s => getPaymentStatus(s).text === 'Pending').length}</span>
                <span className="stat-label">Pending</span>
              </div>
              <div className="stat-badge overdue">
                <span className="stat-number">{subscriptions.filter(s => getPaymentStatus(s).text.includes('Overdue')).length}</span>
                <span className="stat-label">Overdue</span>
              </div>
            </div>
          </div>

          {subscriptions.length > 0 ? (
            <div className="subscriptions-list">
              {subscriptions.map(sub => {
                const status = getPaymentStatus(sub);
                return (
                  <div key={sub.subscriptionId} className={`subscription-item ${status.text.toLowerCase().replace(' ', '-')}`}>
                    <div className="subscription-main">
                      <div className="subscription-info">
                        <h3 className="subscription-title">{sub.planTitle}</h3>
                        <div className="subscription-details">
                          <span className="amount">{formatSats(sub.planAmount)} sats</span>
                          <span className="interval">/ {getIntervalText(sub.planInterval).toLowerCase()}</span>
                          <span className="usd-amount">(${convertSatsToUSD(sub.planAmount)})</span>
                        </div>
                      </div>
                      
                      <div className="subscription-status">
                        <div className={`status-indicator ${status.text.toLowerCase().replace(' ', '-')}`}>
                          <div className="status-dot"></div>
                          <span className="status-text">{status.text}</span>
                        </div>
                        <div className="next-payment">
                          Next payment: {formatDate(sub.nextPayment)}
                        </div>
                      </div>
                    </div>

                    <div className="subscription-actions">
                      {status.text === 'Pending' && (
                        <Button 
                          onClick={() => retryPayment(sub.subscriptionId)} 
                          variant="primary" 
                          size="sm"
                          className="pay-now-btn"
                        >
                          💰 Pay Now
                        </Button>
                      )}
                      <Button 
                        onClick={() => cancelSubscription(sub.subscriptionId)} 
                        variant="danger" 
                        size="sm"
                        className="cancel-btn"
                      >
                        ❌ Cancel
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-subscriptions">
              <div className="empty-icon">💳</div>
              <h3>No Active Subscriptions</h3>
              <p>You haven't subscribed to any plans yet.</p>
              <div className="empty-actions">
                <Button onClick={onSwitchToMarketplace} variant="primary">
                  🛒 Browse Marketplace
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Subscribe Section */}
        <div className="quick-subscribe-section">
          <div className="quick-subscribe-header">
            <h3>Quick Subscribe</h3>
            <p>Have a specific plan ID? Subscribe directly here</p>
          </div>
          
          <div className="quick-subscribe-form">
            <div className="form-row">
              <Input
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                placeholder="Enter plan ID (e.g., plan_abc123)"
                className="plan-id-input"
              />
              <Button onClick={lookupPlan} loading={loading} variant="secondary">
                🔍 Lookup
              </Button>
            </div>
            
            {planDetails && (
              <div className="plan-preview-card">
                <div className="preview-header">
                  <h4>{planDetails.title}</h4>
                  <div className="preview-price">
                    <span className="price-sats">{formatSats(planDetails.amount)} sats</span>
                    <span className="price-interval">/ {getIntervalText(planDetails.interval).toLowerCase()}</span>
                    <span className="price-usd">${convertSatsToUSD(planDetails.amount)}</span>
                  </div>
                </div>
                <p className="preview-description">{planDetails.description}</p>
                <div className="preview-actions">
                  <Button onClick={subscribe} variant="primary">
                    ⚡ Subscribe Now
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}