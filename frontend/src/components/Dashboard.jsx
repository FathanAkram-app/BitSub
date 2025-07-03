import { useState } from 'react'
import PlanCard from './PlanCard'
import CreatePlanModal from './CreatePlanModal'
import TransactionHistory from './TransactionHistory'
import CreatorInsights from './CreatorInsights'
import PaymentProcessor from './PaymentProcessor'

export default function Dashboard({ plans, onLogout, onCreatePlan, onDeletePlan, authClient }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('plans')

  const handleCreatePlan = (planData) => {
    onCreatePlan(planData)
  }

  const handleDeletePlan = async (planId) => {
    await onDeletePlan(planId)
  }

  return (
    <div className="dashboard">
      <div className="section">
        <h2>Creator Dashboard</h2>
        
        <div className="dashboard-tabs">
          <button 
            onClick={() => setActiveTab('plans')}
            className={`tab-btn ${activeTab === 'plans' ? 'active' : ''}`}
          >
            📋 Plans
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            📊 Analytics
          </button>
          <button 
            onClick={() => setActiveTab('insights')}
            className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
          >
            🔍 Insights
          </button>
        </div>
      </div>
      
      {activeTab === 'plans' && (
        <>
          <div className="section">
            <div className="create-section">
              <button 
                onClick={() => setIsModalOpen(true)} 
                className="btn-primary"
              >
                ✨ Create New Plan
              </button>
            </div>
          </div>
      
          <div className="section">
            <h3>Your Plans ({plans.length})</h3>
            {plans.length > 0 ? (
              <div className="plans-grid">
                {plans.map((plan, index) => (
                  <PlanCard key={index} plan={plan} onDelete={handleDeletePlan} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No plans yet. Create your first plan!</p>
              </div>
            )}
          </div>
        </>
      )}
      
      {activeTab === 'analytics' && (
        <TransactionHistory authClient={authClient} />
      )}
      
      {activeTab === 'insights' && (
        <CreatorInsights authClient={authClient} />
      )}
      
      <PaymentProcessor authClient={authClient} />

      <CreatePlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePlan}
      />
    </div>
  )
}