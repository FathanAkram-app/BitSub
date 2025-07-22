import React, { useState, useEffect, useCallback } from 'react';
import { useRealtime } from '../hooks/useRealtime';
import { subscriptionService } from '../services/subscriptionService';
import { transactionService } from '../services/transactionService';
import { usePrice } from '../hooks/usePrice';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';

interface AnalyticsProps {
  authClient: any;
}

interface Stats {
  totalRevenue: number;
  totalSubscriptions: number;
  monthlyGrowth: number;
}

interface Transaction {
  id: number;
  type: string;
  planTitle: string;
  subscriber: string;
  amount: number;
  status: string;
  timestamp: number;
  txHash: string | null;
}

interface ChartData {
  label: string;
  revenue: number;
}

export default function Analytics({ authClient }: AnalyticsProps): React.ReactElement {
  const [stats, setStats] = useState<Stats>({ totalRevenue: 0, totalSubscriptions: 0, monthlyGrowth: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [period, setPeriod] = useState<string>('monthly');
  const [loading, setLoading] = useState<boolean>(true);

  const { convertSatsToUSD } = usePrice(authClient);

  const refreshData = useCallback(() => {
    loadData();
  }, [authClient, period]);
  
  useRealtime(refreshData, 3000);
  
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const loadData = async (): Promise<void> => {
    if (!authClient) return;
    
    try {
      const statsData = await transactionService.getStats(authClient);
      const txData = await transactionService.getTransactions(authClient);
      const chartDataResult = await transactionService.getChartData(authClient, period);
      
      // Only update if data actually changed
      if (JSON.stringify(statsData) !== JSON.stringify(stats)) {
        setStats(statsData);
      }
      if (JSON.stringify(txData) !== JSON.stringify(transactions)) {
        setTransactions(txData);
      }
      if (JSON.stringify(chartDataResult) !== JSON.stringify(chartData)) {
        setChartData(chartDataResult);
      }
      
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
    setLoading(false);
  };

  if (loading) return <div className="analytics-loading">📊 Loading analytics...</div>;

  return (
    <div className="analytics-dashboard">
      {/* Stats Overview */}
      <div className="analytics-header">
        <div className="analytics-title">
          <h2>📊 Revenue Analytics</h2>
          <p>Track your subscription performance and revenue trends</p>
        </div>
      </div>

      <div className="analytics-stats-grid">
        <div className="analytics-stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h4>Total Revenue</h4>
            <div className="stat-value">{stats.totalRevenue.toLocaleString()} sats</div>
            <div className="stat-subtitle">${convertSatsToUSD(stats.totalRevenue)}</div>
          </div>
        </div>
        <div className="analytics-stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h4>Active Subscriptions</h4>
            <div className="stat-value">{stats.totalSubscriptions}</div>
            <div className="stat-subtitle">Total subscribers</div>
          </div>
        </div>
        <div className="analytics-stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h4>Monthly Growth</h4>
            <div className="stat-value growth-positive">+{stats.monthlyGrowth}%</div>
            <div className="stat-subtitle">Revenue growth</div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="analytics-chart-section">
        <div className="chart-card">
          <div className="chart-header">
            <div className="chart-title">
              <h3>📊 Revenue Trends</h3>
              <p>Track your earnings over time</p>
            </div>
            <div className="chart-filters">
              {['daily', 'monthly', 'yearly'].map((p: string) => (
                <button 
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`chart-filter-btn ${period === p ? 'active' : ''}`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="chart-container">
            {chartData.length > 0 ? (
              <div className="chart-bars">
                {chartData.map((data: ChartData, index: number) => {
                  const maxRevenue = Math.max(...chartData.map((d: ChartData) => d.revenue), 1);
                  const heightPercent = (data.revenue / maxRevenue) * 100;
                  return (
                    <div key={index} className="chart-bar-wrapper">
                      <div className="chart-bar-container">
                        <div 
                          className="chart-bar" 
                          style={{height: `${Math.max(heightPercent, 2)}%`}}
                          title={`${data.label}: ${data.revenue.toLocaleString()} sats ($${convertSatsToUSD(data.revenue)})`}
                        >
                          <div className="bar-value">{data.revenue > 0 ? `${data.revenue.toLocaleString()}` : ''}</div>
                        </div>
                      </div>
                      <div className="chart-label">{data.label}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="chart-empty">
                <div className="empty-chart-icon">📊</div>
                <h4>No revenue data yet</h4>
                <p>Revenue trends will appear here once you start earning</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="analytics-transactions-section">
        <div className="transactions-card">
          <div className="transactions-header">
            <h3>💳 Recent Transactions</h3>
            <p>Latest subscription payments and activities</p>
          </div>
          
          {transactions.length > 0 ? (
            <div className="transactions-table">
              <div className="table-header">
                <div className="table-col">Type</div>
                <div className="table-col">Plan</div>
                <div className="table-col">Subscriber</div>
                <div className="table-col">Amount</div>
                <div className="table-col">Status</div>
              </div>
              <div className="table-body">
                {transactions.slice(0, 10).map((tx: Transaction) => (
                  <div key={tx.id} className="table-row">
                    <div className="table-col">
                      <span className="transaction-type">{tx.type}</span>
                    </div>
                    <div className="table-col">
                      <span className="plan-name">{tx.planTitle}</span>
                    </div>
                    <div className="table-col">
                      <span className="subscriber-id">...{tx.subscriber}</span>
                    </div>
                    <div className="table-col">
                      <div className="amount-display">
                        <span className="amount-sats">{tx.amount.toLocaleString()} sats</span>
                        <span className="amount-usd">${convertSatsToUSD(tx.amount)}</span>
                      </div>
                    </div>
                    <div className="table-col">
                      <span className={`status-badge status-${tx.status.toLowerCase()}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="transactions-empty">
              <div className="empty-transactions-icon">💳</div>
              <h4>No transactions yet</h4>
              <p>Transaction history will appear here once subscribers start paying</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}