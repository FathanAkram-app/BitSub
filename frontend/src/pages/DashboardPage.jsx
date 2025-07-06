import { useState } from 'react'
import { usePlans } from '../hooks/useSubscriptions'
import { usePrice } from '../hooks/usePrice'
import { subscriptionService } from '../services/subscriptionService'
import { Button, Card, CardContent, Loading, EmptyState } from '../components/ui'
import { formatSats, getIntervalText } from '../utils/helpers'
import CreatePlanModal from '../components/CreatePlanModal'
import Analytics from '../components/Analytics'
import Insights from '../components/Insights'
import ShareableLink from '../components/ShareableLink'

export default function Dashboard({ authClient }) {
  const [activeTab, setActiveTab] = useState('plans')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { plans, loading, refetch } = usePlans(authClient)
  const { convertSatsToUSD } = usePrice(authClient)

  const handleCreatePlan = async (planData) => {
    const result = await subscriptionService.createPlan(authClient, planData)
    if ('ok' in result) {
      setIsModalOpen(false)
      refetch()
    }
  }

  const handleDeletePlan = async (planId) => {
    if (confirm('Delete this plan?')) {
      await subscriptionService.deletePlan(authClient, planId)
      refetch()
    }
  }

  if (loading) return <Loading text="Loading dashboard..." />

  return (
    <div className="dashboard">
      <div className="section">
        <h2>Creator Dashboard</h2>
        <div className="dashboard-tabs">
          {['plans', 'analytics', 'insights'].map(tab => (
            <Button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={activeTab === tab ? 'primary' : 'secondary'}
            >
              {tab === 'plans' && '📋 Plans'}
              {tab === 'analytics' && '📊 Analytics'}  
              {tab === 'insights' && '🔍 Insights'}
            </Button>
          ))}
        </div>
      </div>
      
      {activeTab === 'plans' && (
        <>
          <div className="section">
            <Button onClick={() => setIsModalOpen(true)}>✨ Create Plan</Button>
          </div>
          <div className="section">
            <h3>Plans ({plans.length})</h3>
            {plans.length > 0 ? (
              <div className="plans-grid">
                {plans.map(plan => (
                  <Card key={plan.planId} className="plan-card">
                    <CardContent>
                      <div className="plan-card-header">
                        <h4>{plan.title}</h4>
                        <ShareableLink planId={plan.planId} planTitle={plan.title} />
                      </div>
                      <div className="plan-card-content">
                        <p>{plan.description}</p>
                        <div className="plan-amount">
                          {formatSats(plan.amount)} sats/{getIntervalText(plan.interval)}
                          <div className="usd-amount">${convertSatsToUSD(plan.amount)}</div>
                        </div>
                        <div className="plan-id">ID: {plan.planId}</div>
                      </div>
                      <div className="plan-card-actions">
                        <Button onClick={() => handleDeletePlan(plan.planId)} variant="danger" size="small">
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState 
                title="No plans yet"
                description="Create your first subscription plan to get started"
                action={<Button onClick={() => setIsModalOpen(true)}>Create Plan</Button>}
              />
            )}
          </div>
        </>
      )}
      
      {activeTab === 'analytics' && <Analytics authClient={authClient} />}
      {activeTab === 'insights' && <Insights authClient={authClient} />}

      <CreatePlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePlan}
      />
    </div>
  )
}