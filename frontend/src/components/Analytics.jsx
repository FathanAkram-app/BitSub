import { useState, useEffect, useCallback } from 'react'
import { useRealtime } from '../hooks/useRealtime'
import { subscriptionService } from '../services/subscriptionService'
import { usePrice } from '../hooks/usePrice'
import { Card, CardContent } from './ui/Card'
import { Button } from './ui/Button'

export default function Analytics({ authClient }) {
  const [stats, setStats] = useState({ totalRevenue: 0, totalSubscriptions: 0, monthlyGrowth: 0 })
  const [transactions, setTransactions] = useState([])
  const [chartData, setChartData] = useState([])
  const [period, setPeriod] = useState('monthly')
  const [loading, setLoading] = useState(true)

  const { convertSatsToUSD } = usePrice(authClient)

  const refreshData = useCallback(() => {
    loadData()
  }, [authClient, period])
  
  useRealtime(refreshData, 3000)
  
  useEffect(() => {
    refreshData()
  }, [refreshData])

  const loadData = async () => {
    if (!authClient) return
    
    try {
      const statsData = await subscriptionService.getCreatorStats(authClient)
      const txData = await subscriptionService.getCreatorTransactions(authClient)
      const chartDataResult = await subscriptionService.getChartData(authClient, period)
      
      // Only update if data actually changed
      if (JSON.stringify(statsData) !== JSON.stringify(stats)) {
        setStats(statsData)
      }
      if (JSON.stringify(txData) !== JSON.stringify(transactions)) {
        setTransactions(txData)
      }
      if (JSON.stringify(chartDataResult) !== JSON.stringify(chartData)) {
        setChartData(chartDataResult)
      }
      
    } catch (error) {
      console.error('Failed to load analytics:', error)
    }
    setLoading(false)
  }

  if (loading) return <div className="loading">Loading analytics...</div>

  return (
    <div className="analytics">
      <div className="stats-grid">
        <Card>
          <CardContent>
            <h4>Total Revenue</h4>
            <div className="stat-value">{stats.totalRevenue.toLocaleString()} sats</div>
            <div className="stat-subtitle">${convertSatsToUSD(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h4>Subscriptions</h4>
            <div className="stat-value">{stats.totalSubscriptions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h4>Growth</h4>
            <div className="stat-value">+{stats.monthlyGrowth}%</div>
          </CardContent>
        </Card>
      </div>

      <Card className="chart-section">
        <CardContent>
          <div className="chart-header">
            <h3>Revenue Chart</h3>
            <div className="chart-filters">
              {['daily', 'monthly', 'yearly'].map(p => (
                <Button 
                  key={p}
                  onClick={() => setPeriod(p)}
                  variant={period === p ? 'primary' : 'secondary'}
                  size="small"
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          <div className="chart-bars">
            {chartData.map((data, index) => (
              <div key={index} className="chart-bar-container">
                <div 
                  className="chart-bar" 
                  style={{height: `${(data.revenue / Math.max(...chartData.map(d => d.revenue), 1)) * 100}%`}}
                  title={`${data.label}: ${data.revenue.toLocaleString()} sats`}
                ></div>
                <span className="chart-label">{data.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="transactions-section">
        <CardContent>
          <h3>Recent Transactions</h3>
          <div className="transactions-table">
            <div className="table-header">
              <div>Type</div><div>Plan</div><div>User</div><div>Amount</div><div>Status</div>
            </div>
            {transactions.map(tx => (
              <div key={tx.id} className="table-row">
                <div>{tx.type}</div>
                <div>{tx.planTitle}</div>
                <div>...{tx.subscriber}</div>
                <div>{tx.amount.toLocaleString()} sats</div>
                <div className={`status-${tx.status.toLowerCase()}`}>{tx.status}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}