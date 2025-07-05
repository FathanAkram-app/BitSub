import { useState, useEffect } from 'react'
import { useSubscriptions } from '../hooks/useSubscriptions'
import { useWallet } from '../hooks/useWallet'
import { usePrice } from '../hooks/usePrice'
import { subscriptionService } from '../services/subscriptionService'
import { Button, Card, CardContent, Loading, EmptyState, Input } from '../components/ui'
import { formatSats, getIntervalText, formatDate } from '../utils/helpers'
import Wallet from '../components/Wallet'

export default function SubscriberDashboard({ authClient }) {
  const [planId, setPlanId] = useState('')
  const [planDetails, setPlanDetails] = useState(null)
  const [loading, setLoading] = useState(false)

  const { subscriptions, refetch } = useSubscriptions(authClient)
  const { balance } = useWallet(authClient)
  const { convertSatsToUSD } = usePrice(authClient)

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

  const lookupPlanById = async (id) => {
    if (!id.trim()) return
    setLoading(true)
    try {
      const result = await subscriptionService.getPlan(authClient, id)
      setPlanDetails(result.length > 0 ? result[0] : null)
    } catch (error) {
      console.error('Failed to lookup plan:', error)
    }
    setLoading(false)
  }

  const lookupPlan = async () => {
    await lookupPlanById(planId)
  }

  const subscribe = async () => {
    const result = await subscriptionService.subscribe(authClient, planDetails.planId)
    if ('ok' in result) {
      setPlanDetails(null)
      setPlanId('')
      refetch()
    }
  }

  const cancelSubscription = async (id) => {
    if (confirm('Cancel this subscription?')) {
      await subscriptionService.cancelSubscription(authClient, id)
      refetch()
    }
  }

  const getPaymentStatus = (sub) => {
    const nextPayment = Number(sub.nextPayment) / 1000000
    const now = Date.now()
    const overdue = nextPayment <= now
    const hasPaid = sub.lastPayment.length > 0
    
    if (overdue && balance < sub.planAmount) return { text: 'Insufficient Balance', color: '#ff6b6b' }
    if (overdue) return { text: 'Payment Overdue', color: '#ff6b6b' }
    if (hasPaid) return { text: 'Paid', color: '#00ff88' }
    return { text: 'Pending', color: '#ffc107' }
  }

  return (
    <div className="dashboard">
      <Wallet authClient={authClient} />
      
      <div className="section">
        <h2>Subscribe to Plan</h2>
        <div className="form-group">
          <Input
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
            placeholder="Enter plan ID"
          />
          <Button onClick={lookupPlan} loading={loading}>Lookup</Button>
        </div>
        
        {planDetails && (
          <Card className="plan-preview">
            <CardContent>
              <h4>{planDetails.title}</h4>
              <p>{planDetails.description}</p>
              <div className="plan-amount">
                {formatSats(planDetails.amount)} sats/{getIntervalText(planDetails.interval)}
                <div className="usd-amount">${convertSatsToUSD(planDetails.amount)}</div>
              </div>
              <Button onClick={subscribe}>Subscribe Now</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="section">
        <h3>My Subscriptions ({subscriptions.length})</h3>
        {subscriptions.length > 0 ? (
          <div className="subscriptions-grid">
            {subscriptions.map(sub => (
              <Card key={sub.subscriptionId} className="subscription-card">
                <CardContent>
                  <h4>{sub.planTitle}</h4>
                  <div className="plan-amount">
                    {formatSats(sub.planAmount)} sats/{getIntervalText(sub.planInterval)}
                    <div className="usd-amount">${convertSatsToUSD(sub.planAmount)}</div>
                  </div>
                  <div className="payment-status" style={{ color: getPaymentStatus(sub).color }}>
                    {getPaymentStatus(sub).text}
                  </div>
                  <div className="next-payment">
                    Next: {formatDate(sub.nextPayment)}
                  </div>
                  <Button onClick={() => cancelSubscription(sub.subscriptionId)} variant="danger" size="small">
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState 
            title="No subscriptions yet"
            description="Enter a plan ID above to subscribe"
          />
        )}
      </div>
    </div>
  )
}