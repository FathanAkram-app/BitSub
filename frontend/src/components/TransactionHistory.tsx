import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Transaction, TransactionStatus, TransactionType } from '../types';
import { Card, Loading, Button } from './ui';
import { subscriptionService } from '../services/subscriptionService';
import { usePrice } from '../hooks/usePrice';

interface TransactionHistoryProps {
  authClient: AuthClient;
}

interface TransactionItemProps {
  transaction: Transaction;
  usdValue: (sats: number) => string;
}

function TransactionItem({ transaction, usdValue }: TransactionItemProps): React.ReactElement {
  const getTransactionType = (txType: any): TransactionType => {
    if (txType.Payment !== undefined) return 'Payment';
    if (txType.Subscription !== undefined) return 'Subscription';
    if (txType.Refund !== undefined) return 'Refund';
    return 'Payment';
  };

  const getTransactionStatus = (status: any): TransactionStatus => {
    if (status.Pending !== undefined) return 'Pending';
    if (status.Confirmed !== undefined) return 'Confirmed';
    if (status.Failed !== undefined) return 'Failed';
    return 'Pending';
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp / 1000000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: TransactionStatus): string => {
    switch (status) {
      case 'Confirmed': return '✅';
      case 'Failed': return '❌';
      case 'Pending': return '⏳';
      default: return '⏳';
    }
  };

  const getTypeIcon = (type: TransactionType): string => {
    switch (type) {
      case 'Payment': return '💰';
      case 'Subscription': return '📝';
      case 'Refund': return '🔄';
      default: return '💰';
    }
  };

  const txType = getTransactionType(transaction.txType);
  const txStatus = getTransactionStatus(transaction.status);
  const usdAmount = usdValue(transaction.amount);

  return (
    <div className="transaction-item">
      <div className="transaction-icon">
        {getTypeIcon(txType)}
      </div>
      
      <div className="transaction-details">
        <div className="transaction-header">
          <span className="transaction-type">{txType}</span>
          <span className={`transaction-status status-${txStatus.toLowerCase()}`}>
            {getStatusIcon(txStatus)} {txStatus}
          </span>
        </div>
        
        <div className="transaction-meta">
          <span className="transaction-plan">Plan: {transaction.planId}</span>
          <span className="transaction-date">{formatDate(transaction.timestamp)}</span>
        </div>
        
        {transaction.txHash && (
          <div className="transaction-hash">
            <span className="hash-label">TX Hash:</span>
            <span className="hash-value" title={transaction.txHash}>
              {transaction.txHash.slice(0, 16)}...
            </span>
          </div>
        )}
      </div>
      
      <div className="transaction-amount">
        <div className="amount-sats">{transaction.amount.toLocaleString()} sats</div>
        <div className="amount-usd">${usdAmount}</div>
      </div>
    </div>
  );
}

interface FilterControlsProps {
  statusFilter: TransactionStatus | 'all';
  typeFilter: TransactionType | 'all';
  onStatusChange: (status: TransactionStatus | 'all') => void;
  onTypeChange: (type: TransactionType | 'all') => void;
  onRefresh: () => void;
}

function FilterControls({ 
  statusFilter, 
  typeFilter, 
  onStatusChange, 
  onTypeChange, 
  onRefresh 
}: FilterControlsProps): React.ReactElement {
  return (
    <div className="filter-controls">
      <div className="filter-group">
        <label>Status:</label>
        <select 
          value={statusFilter} 
          onChange={(e) => onStatusChange(e.target.value as TransactionStatus | 'all')}
          className="filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>
      </div>
      
      <div className="filter-group">
        <label>Type:</label>
        <select 
          value={typeFilter} 
          onChange={(e) => onTypeChange(e.target.value as TransactionType | 'all')}
          className="filter-select"
        >
          <option value="all">All Types</option>
          <option value="Payment">Payments</option>
          <option value="Subscription">Subscriptions</option>
          <option value="Refund">Refunds</option>
        </select>
      </div>
      
      <Button onClick={onRefresh} variant="secondary" size="sm">
        🔄 Refresh
      </Button>
    </div>
  );
}

interface TransactionStatsProps {
  transactions: Transaction[];
  usdValue: (sats: number) => string;
}

function TransactionStats({ transactions, usdValue }: TransactionStatsProps): React.ReactElement {
  const stats = transactions.reduce((acc, tx) => {
    const txType = tx.txType.Payment !== undefined ? 'Payment' : 
                   tx.txType.Subscription !== undefined ? 'Subscription' : 'Refund';
    const txStatus = tx.status.Confirmed !== undefined ? 'Confirmed' : 
                     tx.status.Pending !== undefined ? 'Pending' : 'Failed';
    
    if (txStatus === 'Confirmed') {
      acc.totalAmount += tx.amount;
      acc.confirmedCount++;
    }
    
    if (txType === 'Payment') acc.paymentCount++;
    if (txStatus === 'Pending') acc.pendingCount++;
    if (txStatus === 'Failed') acc.failedCount++;
    
    return acc;
  }, {
    totalAmount: 0,
    confirmedCount: 0,
    paymentCount: 0,
    pendingCount: 0,
    failedCount: 0
  });

  const totalUsd = usdValue(stats.totalAmount);

  return (
    <div className="transaction-stats">
      <div className="stat-card">
        <div className="stat-value">{stats.confirmedCount}</div>
        <div className="stat-label">Confirmed</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-value">{stats.paymentCount}</div>
        <div className="stat-label">Payments</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-value">{stats.pendingCount}</div>
        <div className="stat-label">Pending</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-value">{stats.totalAmount.toLocaleString()}</div>
        <div className="stat-label">Total Sats</div>
      </div>
      
      <div className="stat-card highlight">
        <div className="stat-value">${totalUsd}</div>
        <div className="stat-label">Total USD</div>
      </div>
    </div>
  );
}

export default function TransactionHistory({ authClient }: TransactionHistoryProps): React.ReactElement {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  
  const { convertSatsToUSD } = usePrice(authClient);

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, statusFilter, typeFilter]);

  const loadTransactions = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const txs = await subscriptionService.getCreatorTransactions(authClient);
      setTransactions(txs);
    } catch (err) {
      setError('Failed to load transaction history');
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = (): void => {
    let filtered = transactions;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => {
        const txStatus = tx.status.Confirmed !== undefined ? 'Confirmed' : 
                         tx.status.Pending !== undefined ? 'Pending' : 'Failed';
        return txStatus === statusFilter;
      });
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => {
        const txType = tx.txType.Payment !== undefined ? 'Payment' : 
                       tx.txType.Subscription !== undefined ? 'Subscription' : 'Refund';
        return txType === typeFilter;
      });
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    
    setFilteredTransactions(filtered);
  };

  if (loading) {
    return (
      <Card title="Transaction History">
        <Loading text="Loading transactions..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Transaction History">
        <div className="error-state">
          <p>{error}</p>
          <Button onClick={loadTransactions} variant="primary">
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Transaction History" className="transaction-history">
      {transactions.length > 0 && (
        <TransactionStats transactions={transactions} usdValue={convertSatsToUSD} />
      )}
      
      <FilterControls
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        onStatusChange={setStatusFilter}
        onTypeChange={setTypeFilter}
        onRefresh={loadTransactions}
      />

      <div className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <h3>No transactions found</h3>
            <p>
              {transactions.length === 0 
                ? 'No transactions yet. Start by creating plans and getting subscribers!'
                : 'No transactions match your current filters.'
              }
            </p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              usdValue={convertSatsToUSD}
            />
          ))
        )}
      </div>
    </Card>
  );
}