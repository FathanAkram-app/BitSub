import React, { useState } from 'react';
import { usePlans } from '../hooks/useSubscriptions';
import { usePrice } from '../hooks/usePrice';
import { subscriptionService } from '../services/subscriptionService';
import { Button, Card, CardContent, Loading, EmptyState } from '../components/ui';
import { formatSats, getIntervalText } from '../utils/helpers';
import CreatePlanModal from '../components/CreatePlanModal';
import Analytics from '../components/Analytics';

import ShareableLink from '../components/ShareableLink';
import { WebhookManager } from '../components/WebhookManager';
import '../components/WebhookManager.css';
import { AuthClient } from '@dfinity/auth-client';

interface DashboardProps {
  authClient: AuthClient;
}

export default function Dashboard({ authClient }: DashboardProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<string>('plans');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [webhookModalOpen, setWebhookModalOpen] = useState<boolean>(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  
  const { plans, loading, refetch } = usePlans(authClient);
  const { convertSatsToUSD } = usePrice(authClient);

  const handleCreatePlan = async (planData: any) => {
    const result = await subscriptionService.createPlan(authClient, planData);
    if ('ok' in result) {
      setIsModalOpen(false);
      refetch();
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (confirm('Delete this plan?')) {
      await subscriptionService.deletePlan(authClient, planId);
      refetch();
    }
  };

  const handleWebhookConfig = (planId: string) => {
    setSelectedPlanId(planId);
    setWebhookModalOpen(true);
  };

  const handleCloseWebhookModal = () => {
    setWebhookModalOpen(false);
    setSelectedPlanId(null);
  };

  if (loading) return <Loading text="Loading dashboard..." />;

  return (
    <div className="creator-dashboard">
      {/* Dashboard Header */}
      <div className="creator-header">
        <div className="header-content">
          <div className="header-main">
            <div className="header-badge">🎨 Creator Dashboard</div>
            <h1>📊 Subscription Management</h1>
            <p>Create and manage your subscription plans</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="creator-navigation">
        <div className="content-container">
          <div className="creator-tabs">
            {['plans', 'analytics'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`creator-tab ${activeTab === tab ? 'active' : ''}`}
              >
                <span className="tab-icon">
                  {tab === 'plans' && '📋'}
                  {tab === 'analytics' && '📊'}
                </span>
                <span className="tab-label">
                  {tab === 'plans' && 'Plans'}
                  {tab === 'analytics' && 'Analytics'}
                </span>
                <span className="tab-count">
                  {tab === 'plans' && plans.length}
                  {tab === 'analytics' && '•'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="creator-content">
      
        {activeTab === 'plans' && (
          <div className="plans-section">
            <div className="section-header">
              <div className="header-main">
                <h2>Subscription Plans</h2>
                <p>Manage your recurring subscription offerings</p>
              </div>
              <Button onClick={() => setIsModalOpen(true)} variant="primary">
                ✨ Create New Plan
              </Button>
            </div>
            
            {plans.length > 0 ? (
              <div className="creator-grid">
                {plans.map(plan => (
                  <div key={plan.planId} className="creator-card-wrapper">
                    <Card className="creator-plan-card">
                      <CardContent>
                        <div className="plan-card-header">
                          <div className="plan-title-section">
                            <h3>{plan.title}</h3>
                            <div className="plan-id">ID: {plan.planId}</div>
                          </div>
                          <ShareableLink planId={plan.planId} planTitle={plan.title} />
                        </div>
                        
                        <div className="plan-description">
                          <p>{plan.description}</p>
                        </div>
                        
                        <div className="plan-pricing">
                          <div className="price-main">
                            <span className="price-sats">{formatSats(plan.amount)} sats</span>
                            <span className="price-interval">/ {getIntervalText(plan.interval)}</span>
                          </div>
                          <div className="price-usd">${convertSatsToUSD(plan.amount)}</div>
                        </div>
                        
                        <div className="plan-actions">
                          <Button 
                            onClick={() => handleWebhookConfig(plan.planId)} 
                            variant="secondary" 
                            size="sm"
                          >
                            🔗 Webhooks
                          </Button>
                          <Button 
                            onClick={() => handleDeletePlan(plan.planId)} 
                            variant="danger" 
                            size="sm"
                          >
                            🗑️ Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            ) : (
              <div className="creator-empty">
                <div className="empty-icon">📋</div>
                <h3>No Plans Created</h3>
                <p>Create your first subscription plan to start earning Bitcoin</p>
                <div className="empty-actions">
                  <Button onClick={() => setIsModalOpen(true)} variant="primary">
                    ✨ Create Your First Plan
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      
        {activeTab === 'analytics' && (
          <div className="analytics-section">
            <Analytics authClient={authClient} />
          </div>
        )}


      </div>

      <CreatePlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePlan}
      />

      {webhookModalOpen && selectedPlanId && (
        <div className="webhook-modal-overlay" onClick={handleCloseWebhookModal}>
          <div onClick={(e) => e.stopPropagation()}>
            <WebhookManager 
              planId={selectedPlanId}
              authClient={authClient}
              onClose={handleCloseWebhookModal}
            />
          </div>
        </div>
      )}
    </div>
  );
}