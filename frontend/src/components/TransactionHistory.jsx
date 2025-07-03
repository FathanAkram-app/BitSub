import { useState, useEffect } from 'react'
import { HttpAgent, Actor } from '@dfinity/agent'
import OKXPriceWidget from './OKXPriceWidget'

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
  const TransactionType = IDL.Variant({
    'Payment' : IDL.Null,
    'Subscription' : IDL.Null,
    'Refund' : IDL.Null
  });
  const TransactionStatus = IDL.Variant({
    'Pending' : IDL.Null,
    'Confirmed' : IDL.Null,
    'Failed' : IDL.Null
  });
  const Transaction = IDL.Record({
    'id' : IDL.Nat,
    'txType' : TransactionType,
    'subscriptionId' : IDL.Nat,
    'planId' : IDL.Text,
    'subscriber' : IDL.Principal,
    'amount' : IDL.Nat,
    'status' : TransactionStatus,
    'timestamp' : IDL.Int,
    'txHash' : IDL.Opt(IDL.Text),
  });
  const Stats = IDL.Record({
    'totalRevenue' : IDL.Nat,
    'totalSubscriptions' : IDL.Nat,
    'monthlyGrowth' : IDL.Float64,
  });

  
  return IDL.Service({
    'getCreatorTransactions' : IDL.Func([IDL.Principal], [IDL.Vec(Transaction)], ['query']),
    'getCreatorStats' : IDL.Func([IDL.Principal], [Stats], ['query']),
    'getChartData' : IDL.Func([IDL.Principal, IDL.Text], [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat))], ['query']),
  });
};

export default function TransactionHistory({ authClient }) {
  const [transactions, setTransactions] = useState([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalSubscriptions: 0,
    monthlyGrowth: 0
  })
  const [chartPeriod, setChartPeriod] = useState('monthly')
  const [chartData, setChartData] = useState([])
  const [maxRevenue, setMaxRevenue] = useState(1)
  const [btcPrice, setBtcPrice] = useState(0)

  useEffect(() => {
    loadTransactions()
    loadStats()
  }, [])
  
  useEffect(() => {
    if (authClient) {
      generateChartData()
    }
  }, [chartPeriod, authClient])

  const loadTransactions = async () => {
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
      })
      
      const txs = await actor.getCreatorTransactions(identity.getPrincipal())
      
      const formattedTxs = txs.map(tx => ({
        id: Number(tx.id),
        type: Object.keys(tx.txType)[0],
        amount: Number(tx.amount),
        planTitle: tx.planId,
        subscriber: tx.subscriber.toString().slice(-8),
        status: Object.keys(tx.status)[0],
        timestamp: Number(tx.timestamp) / 1000000,
        txHash: tx.txHash.length > 0 ? tx.txHash[0] : null
      }))
      
      setTransactions(formattedTxs)
      // Generate chart data after loading transactions
      await generateChartData()
    } catch (error) {
      console.error('Failed to load transactions:', error)
      setTransactions([])
    }
  }
  
  const generateChartData = async () => {
    if (!authClient) return
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
      })
      
      const backendData = await actor.getChartData(identity.getPrincipal(), chartPeriod)
      
      const data = backendData.map(([label, revenue]) => ({
        label,
        revenue: Number(revenue)
      }))
      
      setChartData(data)
      setMaxRevenue(Math.max(...data.map(d => d.revenue), 1))
    } catch (error) {
      console.error('Failed to load chart data:', error)
      setChartData([])
      setMaxRevenue(1)
    }
  }

  const loadStats = async () => {
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(idlFactory, {
        agent,
        canisterId,
      })
      
      const creatorStats = await actor.getCreatorStats(identity.getPrincipal())
      
      setStats({
        totalRevenue: Number(creatorStats.totalRevenue),
        totalSubscriptions: Number(creatorStats.totalSubscriptions),
        monthlyGrowth: Number(creatorStats.monthlyGrowth)
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
      console.error('Failed to load stats:', error)
      setStats({
        totalRevenue: 0,
        totalSubscriptions: 0,
        monthlyGrowth: 0
      })
    }
  }

  const formatAmount = (amount) => {
    return (amount / 100000000).toFixed(8) + ' BTC'
  }
  
  const convertSatsToUSD = (sats) => {
    const btcAmount = sats / 100000000
    return (btcAmount * btcPrice).toFixed(2)
  }

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className="transaction-history">
      <OKXPriceWidget authClient={authClient} />
      
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Revenue</h4>
          <div className="stat-value">{stats.totalRevenue.toLocaleString()} sats</div>
          <div className="stat-subtitle">${convertSatsToUSD(stats.totalRevenue)}</div>
        </div>
        <div className="stat-card">
          <h4>Active Subscriptions</h4>
          <div className="stat-value">{stats.totalSubscriptions}</div>
          <div className="stat-subtitle">subscribers</div>
        </div>
        <div className="stat-card">
          <h4>Monthly Growth</h4>
          <div className="stat-value">+{stats.monthlyGrowth}%</div>
          <div className="stat-subtitle">vs last month</div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h3>Revenue Chart</h3>
          <div className="chart-filters">
            <button 
              onClick={() => setChartPeriod('daily')}
              className={`chart-filter ${chartPeriod === 'daily' ? 'active' : ''}`}
            >
              Daily
            </button>
            <button 
              onClick={() => setChartPeriod('monthly')}
              className={`chart-filter ${chartPeriod === 'monthly' ? 'active' : ''}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setChartPeriod('yearly')}
              className={`chart-filter ${chartPeriod === 'yearly' ? 'active' : ''}`}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="chart-container">
          <div className="chart-bars">
            {chartData.map((data, index) => (
              <div key={index} className="chart-bar-container">
                <div 
                  className="chart-bar" 
                  style={{height: `${(data.revenue / maxRevenue) * 100}%`}}
                  title={`${data.label}: ${data.revenue.toLocaleString()} sats`}
                ></div>
                <span className="chart-label">{data.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="transactions-section">
        <h3>Recent Transactions</h3>
        <div className="transactions-table">
          <div className="table-header">
            <div>Type</div>
            <div>Plan</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Date</div>
          </div>
          {transactions.map((tx) => (
            <div key={tx.id} className="table-row">
              <div className="tx-type">{tx.type}</div>
              <div className="tx-plan">{tx.planTitle}</div>
              <div className="tx-amount">
                {tx.amount > 0 ? (
                  <>
                    <div>{tx.amount.toLocaleString()} sats</div>
                    <div className="usd-amount">${convertSatsToUSD(tx.amount)}</div>
                  </>
                ) : '-'}
              </div>
              <div className={`tx-status status-${tx.status.toLowerCase()}`}>
                {tx.status}
              </div>
              <div className="tx-date">{formatDate(tx.timestamp)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}