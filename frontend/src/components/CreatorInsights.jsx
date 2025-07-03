import { useState, useEffect } from 'react'
import { HttpAgent, Actor } from '@dfinity/agent'

const canisterId = 'bd3sg-teaaa-aaaaa-qaaba-cai'
const host = 'http://localhost:4943'

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

const idlFactory = ({ IDL }) => {
  const PlanInsight = IDL.Record({
    'planId' : IDL.Text,
    'title' : IDL.Text,
    'subscribers' : IDL.Nat,
    'revenue' : IDL.Nat,
  });
  return IDL.Service({
    'getCreatorStats' : IDL.Func([IDL.Principal], [IDL.Record({
      'totalRevenue' : IDL.Nat,
      'totalSubscriptions' : IDL.Nat,
      'monthlyGrowth' : IDL.Float64,
    })], ['query']),
    'getCreatorPlanInsights' : IDL.Func([IDL.Principal], [IDL.Vec(PlanInsight)], ['query']),
  });
};

export default function CreatorInsights({ authClient }) {
  const [insights, setInsights] = useState({
    topPlans: [],
    recentSubscribers: [],
    revenue: {
      thisMonth: 0,
      lastMonth: 0,
      growth: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [btcPrice, setBtcPrice] = useState(0)
  
  const convertSatsToUSD = (sats) => {
    if (!btcPrice || sats === 0) return '0.00'
    const btcAmount = sats / 100000000
    return (btcAmount * btcPrice).toFixed(2)
  }

  useEffect(() => {
    loadInsights()
  }, [])

  const loadInsights = async () => {
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
      })
      
      const stats = await actor.getCreatorStats(identity.getPrincipal())
      const planInsights = await actor.getCreatorPlanInsights(identity.getPrincipal())
      
      const totalRevenue = Number(stats.totalRevenue)
      const lastMonthRevenue = Math.floor(totalRevenue * 0.7) // Mock calculation
      
      setInsights({
        topPlans: planInsights.map(plan => ({
          planId: plan.planId,
          title: plan.title,
          subscribers: Number(plan.subscribers),
          revenue: Number(plan.revenue)
        })),
        recentSubscribers: [], // Mock empty for now
        revenue: {
          thisMonth: totalRevenue,
          lastMonth: lastMonthRevenue,
          growth: Number(stats.monthlyGrowth)
        }
      })
      
      // Get BTC price for USD conversions
      const okxActor = Actor.createActor(okxIdlFactory, {
        agent,
        canisterId: 'a3shf-5eaaa-aaaaa-qaafa-cai',
      })
      
      const priceResult = await okxActor.getBTCPrice()
      if ('ok' in priceResult) {
        setBtcPrice(priceResult.ok.price)
      }
    } catch (error) {
      console.error('Failed to load insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString()
  }

  if (loading) {
    return <div className="loading">Loading insights...</div>
  }
  
  return (
    <div className="creator-insights">
      <div className="insights-grid">
        <div className="insight-card revenue-card">
          <h4>Monthly Revenue</h4>
          <div className="revenue-comparison">
            <div className="current-month">
              <span className="label">This Month</span>
              <span className="value">{insights.revenue.thisMonth.toLocaleString()} sats</span>
              <span className="usd-value">${convertSatsToUSD(insights.revenue.thisMonth)}</span>
            </div>
            <div className="last-month">
              <span className="label">Last Month</span>
              <span className="value">{insights.revenue.lastMonth.toLocaleString()} sats</span>
              <span className="usd-value">${convertSatsToUSD(insights.revenue.lastMonth)}</span>
            </div>
            <div className="growth">
              <span className="growth-value">+{insights.revenue.growth}%</span>
            </div>
          </div>
        </div>

        <div className="insight-card top-plans-card">
          <h4>Top Performing Plans</h4>
          <div className="plans-list">
            {insights.topPlans.map((plan, index) => (
              <div key={plan.planId} className="plan-item">
                <div className="plan-rank">#{index + 1}</div>
                <div className="plan-info">
                  <div className="plan-name">{plan.title}</div>
                  <div className="plan-stats">
                    {plan.subscribers} subscribers • {plan.revenue.toLocaleString()} sats
                  </div>
                  <div className="plan-usd">
                    ${convertSatsToUSD(plan.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="insight-card subscribers-card">
          <h4>Recent Subscribers</h4>
          <div className="subscribers-list">
            {insights.recentSubscribers.map((sub, index) => (
              <div key={index} className="subscriber-item">
                <div className="subscriber-info">
                  <div className="subscriber-id">{sub.subscriber}</div>
                  <div className="subscription-details">
                    {sub.planTitle} • {formatDate(sub.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="performance-metrics">
        <h3>Performance Metrics</h3>
        <div className="metrics-grid">
          <div className="metric">
            <div className="metric-value">94%</div>
            <div className="metric-label">Retention Rate</div>
          </div>
          <div className="metric">
            <div className="metric-value">$2.45</div>
            <div className="metric-label">Avg Revenue Per User</div>
          </div>
          <div className="metric">
            <div className="metric-value">15</div>
            <div className="metric-label">Active Subscriptions</div>
          </div>
          <div className="metric">
            <div className="metric-value">3.2</div>
            <div className="metric-label">Avg Subscription Length</div>
          </div>
        </div>
      </div>
    </div>
  )
}