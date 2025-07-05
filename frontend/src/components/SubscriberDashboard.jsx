import { useState, useEffect } from 'react'
import { HttpAgent, Actor } from '@dfinity/agent'
import PaymentModal from './PaymentModal'
import SubscriptionManagement from './SubscriptionManagement'
import WalletBalance from './WalletBalance'
import SubscriptionAdvancer from './SubscriptionAdvancer'

const okxIdlFactory = ({ IDL }) => {
  const PriceData = IDL.Record({
    'symbol' : IDL.Text,
    'price' : IDL.Float64,
    'timestamp' : IDL.Int,
  });
  const Result = IDL.Variant({ 'ok' : PriceData, 'err' : IDL.Text });
  return IDL.Service({
    'getBTCPrice' : IDL.Func([], [Result], []),
  });
};

import { ENV } from '../config/env'

const canisterId = ENV.CANISTER_IDS.SUBSCRIPTION_MANAGER
const host = ENV.HOST

const idlFactory = ({ IDL }) => {
  const PlanInterval = IDL.Variant({ 
    'Daily' : IDL.Null,
    'Weekly' : IDL.Null,
    'Monthly' : IDL.Null,
    'Yearly' : IDL.Null
  });
  const Plan = IDL.Record({
    'title' : IDL.Text,
    'creator' : IDL.Principal,
    'description' : IDL.Text,
    'amount' : IDL.Nat,
    'planId' : IDL.Text,
    'interval' : PlanInterval,
    'webhookUrl' : IDL.Text,
  });
  const Result = IDL.Variant({ 'ok' : IDL.Nat, 'err' : IDL.Text });
  const SubscriptionStatus = IDL.Variant({
    'Active' : IDL.Null,
    'Paused' : IDL.Null,
    'Canceled' : IDL.Null
  });
  const ActiveSubscription = IDL.Record({
    'subscriptionId' : IDL.Nat,
    'planId' : IDL.Text,
    'subscriber' : IDL.Principal,
    'btcAddress' : IDL.Text,
    'status' : SubscriptionStatus,
    'createdAt' : IDL.Int,
    'lastPayment' : IDL.Opt(IDL.Int),
    'nextPayment' : IDL.Int,
  });
  return IDL.Service({
    'getPlan' : IDL.Func([IDL.Text], [IDL.Opt(Plan)], ['query']),
    'subscribe' : IDL.Func([IDL.Text], [Result], []),
    'getUserSubscriptions' : IDL.Func([IDL.Principal], [IDL.Vec(ActiveSubscription)], ['query']),
    'confirmPayment' : IDL.Func([IDL.Nat], [IDL.Bool], []),
    'cancelSubscription' : IDL.Func([IDL.Nat], [IDL.Bool], []),
  });
};

export default function SubscriberDashboard({ onLogout, authClient }) {
  const [planId, setPlanId] = useState('')
  const [planDetails, setPlanDetails] = useState(null)
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [managedView, setManagedView] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [autoPayingIds, setAutoPayingIds] = useState(new Set())
  const [btcPrice, setBtcPrice] = useState(0)
  
  const convertSatsToUSD = (sats) => {
    if (!btcPrice || sats === 0) return '0.00'
    const btcAmount = sats / 100000000
    return (btcAmount * btcPrice).toFixed(2)
  }
  
  const isOverdue = (subscription) => {
    const nextPayment = Number(subscription.nextPayment) / 1000000
    return Date.now() > nextPayment
  }

  const canAutoPay = (subscription) => {
    return walletBalance >= subscription.planAmount && isOverdue(subscription)
  }
  
  const getPaymentStatus = (subscription) => {
    const nextPayment = Number(subscription.nextPayment) / 1000000
    const now = Date.now()
    const daysDiff = Math.ceil((nextPayment - now) / (1000 * 60 * 60 * 24))
    
    if (subscription.lastPayment && nextPayment > now) {
      return { status: 'paid', text: `Paid - Next in ${daysDiff} days`, color: '#00ff88' }
    } else if (nextPayment <= now) {
      return { status: 'overdue', text: 'Payment Overdue', color: '#ff6b6b' }
    } else {
      return { status: 'pending', text: `Due in ${daysDiff} days`, color: '#ffc107' }
    }
  }

  useEffect(() => {
    loadMySubscriptions()
  }, [])
  
  useEffect(() => {
    // Auto-pay when wallet balance updates
    if (walletBalance > 0) {
      subscriptions.forEach(sub => {
        if (canAutoPay(sub) && !autoPayingIds.has(sub.subscriptionId)) {
          setTimeout(() => autoPaySubscription(sub), 500)
        }
      })
    }
  }, [walletBalance])

  const loadMySubscriptions = async () => {
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
      })
      
      const userSubs = await actor.getUserSubscriptions(identity.getPrincipal())
      
      // Get plan details for each subscription
      const subsWithPlans = await Promise.all(
        userSubs.map(async (sub) => {
          const planResult = await actor.getPlan(sub.planId)
          const plan = planResult.length > 0 ? planResult[0] : null
          return {
            ...sub,
            subscriptionId: Number(sub.subscriptionId),
            planTitle: plan ? plan.title : 'Unknown Plan',
            planAmount: plan ? Number(plan.amount) : 0,
            planInterval: plan ? plan.interval : { Monthly: null },
            nextPayment: Number(sub.nextPayment)
          }
        })
      )
      
      setSubscriptions(subsWithPlans)
      
      // Get BTC price for USD conversions
      const okxActor = Actor.createActor(okxIdlFactory, {
        agent,
        canisterId: ENV.CANISTER_IDS.OKX_INTEGRATION,
      })
      
      const priceResult = await okxActor.getBTCPrice()
      if ('ok' in priceResult) {
        setBtcPrice(priceResult.ok.price)
      }
      
      // Auto-pay overdue subscriptions if wallet has sufficient balance
      subsWithPlans.forEach(sub => {
        if (canAutoPay(sub) && !autoPayingIds.has(sub.subscriptionId)) {
          setTimeout(() => autoPaySubscription(sub), 1000)
        }
      })
    } catch (error) {
      console.error('Failed to load subscriptions:', error)
      setSubscriptions([])
    }
  }

  const getIntervalText = (interval) => {
    if (interval.Daily !== undefined) return 'day'
    if (interval.Monthly !== undefined) return 'month'
    if (interval.Yearly !== undefined) return 'year'
    return 'month'
  }

  const autoPaySubscription = async (subscription) => {
    if (walletBalance < subscription.planAmount) return
    if (autoPayingIds.has(subscription.subscriptionId)) return
    
    setAutoPayingIds(prev => new Set([...prev, subscription.subscriptionId]))
    
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      // Withdraw from wallet
      const walletActor = Actor.createActor(walletIdlFactory, {
        agent,
        canisterId: ENV.CANISTER_IDS.WALLET_MANAGER,
      })
      
      const withdrawResult = await walletActor.withdraw(
        identity.getPrincipal(),
        BigInt(subscription.planAmount)
      )
      
      if (withdrawResult) {
        // Confirm payment
        const subscriptionActor = Actor.createActor(idlFactory, {
          agent,
          canisterId,
        })
        
        await subscriptionActor.confirmPayment(Number(subscription.subscriptionId))
        loadMySubscriptions()
      }
    } catch (error) {
      console.error('Auto payment failed:', error)
    } finally {
      setAutoPayingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(subscription.subscriptionId)
        return newSet
      })
    }
  }

  const walletIdlFactory = ({ IDL }) => {
    return IDL.Service({
      'withdraw' : IDL.Func([IDL.Principal, IDL.Nat64], [IDL.Bool], []),
    });
  };

  const lookupPlan = async () => {
    if (!planId.trim()) return
    
    setLoading(true)
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
      })
      
      const planResult = await actor.getPlan(planId)
      if (planResult.length > 0) {
        setPlanDetails(planResult[0])
      } else {
        setPlanDetails(null)
        alert('Plan not found')
      }
    } catch (error) {
      console.error('Failed to lookup plan:', error)
      setPlanDetails(null)
      alert('Failed to lookup plan')
    }
    setLoading(false)
  }

  const subscribeToPlan = async () => {
    if (!planDetails) return
    
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
      })
      
      const result = await actor.subscribe(planDetails.planId)
      if ('ok' in result) {
        alert(`Successfully subscribed to ${planDetails.title}! Subscription ID: ${result.ok}`)
        setPlanDetails(null)
        setPlanId('')
        loadMySubscriptions()
      } else {
        alert(`Subscription failed: ${result.err}`)
      }
    } catch (error) {
      console.error('Failed to subscribe:', error)
      alert('Failed to subscribe to plan')
    }
  }

  const deleteSubscription = async (subscriptionId) => {
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
      })
      
      const result = await actor.cancelSubscription(subscriptionId)
      if (result) {
        alert('Subscription deleted successfully!')
        loadMySubscriptions()
      } else {
        alert('Failed to delete subscription')
      }
    } catch (error) {
      console.error('Failed to delete subscription:', error)
      alert('Failed to delete subscription')
    }
  }

  return (
    <div className="dashboard">
      <WalletBalance 
        authClient={authClient}
        onBalanceUpdate={setWalletBalance}
        btcPrice={btcPrice}
      />
      
      <div className="section">
        <h2>Subscribe to Plan</h2>
        <div className="subscribe-form">
          <div className="form-group">
            <label>Plan ID</label>
            <div className="plan-input-group">
              <input
                type="text"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                placeholder="Enter plan ID from creator"
                className="plan-input"
              />
              <button 
                onClick={lookupPlan}
                disabled={!planId.trim() || loading}
                className="btn-primary lookup-btn"
              >
                {loading ? 'Looking up...' : 'Lookup'}
              </button>
            </div>
            <small className="form-help">
              Get the plan ID from the creator you want to subscribe to
            </small>
          </div>
          
          {planDetails && (
            <div className="plan-preview">
              <h3>Plan Details</h3>
              <div className="plan-card">
                <h4>{planDetails.title}</h4>
                <p>{planDetails.description}</p>
                <div className="plan-amount">
                  {planDetails.amount.toString()} sats/{getIntervalText(planDetails.interval)}
                  {btcPrice > 0 && convertSatsToUSD && (
                    <div className="usd-amount">${convertSatsToUSD(planDetails.amount) || '0.00'}/{getIntervalText(planDetails.interval)}</div>
                  )}
                </div>
                <div className="plan-id">ID: {planDetails.planId}</div>
                <button 
                  onClick={subscribeToPlan}
                  className="btn-primary subscribe-btn"
                >
                  Subscribe Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <h3>My Subscriptions ({subscriptions.length})</h3>
        <div className="subscription-controls">
          <button 
            onClick={() => setManagedView(!managedView)}
            className={`btn-secondary view-toggle ${managedView ? 'active' : ''}`}
          >
            {managedView ? '📋 Simple View' : '⚙️ Manage View'}
          </button>
        </div>
        
        {subscriptions.length > 0 ? (
          managedView ? (
            <div className="managed-subscriptions">
              {subscriptions.map((sub) => (
                <SubscriptionManagement
                  key={sub.subscriptionId}
                  subscription={sub}
                  onCancel={deleteSubscription}
                  onPause={(id) => console.log('Pause:', id)}
                  onResume={(id) => console.log('Resume:', id)}
                />
              ))}
            </div>
          ) : (
            <div className="subscriptions-grid">
              {subscriptions.map((sub) => (
                <div key={sub.subscriptionId} className="subscription-card">
                  <h4>{sub.planTitle}</h4>
                  <div className="plan-amount">
                    {sub.planAmount.toString()} sats/{getIntervalText(sub.planInterval)}
                    {btcPrice > 0 && (
                      <div className="usd-amount">${convertSatsToUSD(sub.planAmount)}/{getIntervalText(sub.planInterval)}</div>
                    )}
                  </div>
                  <div className="subscription-status">
                    {Object.keys(sub.status)[0]}
                  </div>
                  <div 
                    className="payment-status"
                    style={{ color: getPaymentStatus(sub).color }}
                  >
                    {getPaymentStatus(sub).status === 'paid' && '✅'}
                    {getPaymentStatus(sub).status === 'overdue' && '⚠️'}
                    {getPaymentStatus(sub).status === 'pending' && '⏳'}
                    {' '}{getPaymentStatus(sub).text}
                  </div>
                  <div className="subscription-id">ID: {sub.subscriptionId}</div>
                  <div className="btc-address">Address: {sub.btcAddress}</div>
                  <div className="next-payment">
                    Next: {new Date(Number(sub.nextPayment) / 1000000).toLocaleDateString()}
                  </div>
                  <SubscriptionAdvancer
                    subscription={sub}
                    authClient={authClient}
                    onAdvanced={loadMySubscriptions}
                  />
                  {canAutoPay(sub) && (
                    <div className="auto-payment">
                      <button 
                        onClick={() => autoPaySubscription(sub)}
                        disabled={autoPayingIds.has(sub.subscriptionId)}
                        className="btn-primary auto-pay-btn"
                      >
                        {autoPayingIds.has(sub.subscriptionId) ? 'Paying...' : '💰 Auto Pay'}
                      </button>
                    </div>
                  )}
                  {!canAutoPay(sub) && walletBalance < sub.planAmount && (
                    <div className="insufficient-funds">
                      <span>Insufficient wallet balance</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="empty-state">
            <p>No active subscriptions. Enter a plan ID above to subscribe!</p>
          </div>
        )}
      </div>

    </div>
  )
}