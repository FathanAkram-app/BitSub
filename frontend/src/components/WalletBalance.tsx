import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { usePrice } from '../hooks/usePrice';
import { Button } from './ui/Button';
import { AuthClient } from '@dfinity/auth-client';

interface WalletBalanceProps {
  authClient: AuthClient | undefined;
  variant?: 'header' | 'card' | 'inline';
  showActions?: boolean;
}

export function WalletBalance({
  authClient,
  variant = 'inline',
  showActions = false
}: WalletBalanceProps): React.ReactElement {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { balance, loading, refetch } = useWallet(authClient);
  const { convertSatsToUSD } = usePrice(authClient);

  const handleRefresh = async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className={`wallet-balance wallet-balance--${variant} wallet-balance--loading`}>
        <div className="wallet-balance__loading">Loading...</div>
      </div>
    );
  }

  const formatBalance = () => {
    if (variant === 'header') {
      return balance >= 1000000 
        ? `${(balance / 1000000).toFixed(1)}M sats`
        : `${balance.toLocaleString()} sats`;
    }
    return `${balance.toLocaleString()} sats`;
  };

  const formatUSD = () => {
    const usdValue = convertSatsToUSD(balance);
    return variant === 'header' 
      ? `$${usdValue}`
      : `($${usdValue})`;
  };

  if (variant === 'header') {
    return (
      <div className="wallet-balance-compact">
        <span className="wallet-icon">₿</span>
        <span className="wallet-amount">{formatBalance()}</span>
        {showActions && (
          <button
            className="wallet-add-btn"
            onClick={handleRefresh}
            title="Refresh balance"
            disabled={isRefreshing}
          >
            {isRefreshing ? '…' : '↻'}
          </button>
        )}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="wallet-balance wallet-balance--card">
        <div className="wallet-balance__header">
          <h3>Wallet Balance</h3>
          <div className="wallet-balance__icon">₿</div>
        </div>
        <div className="wallet-balance__amount-large">{formatBalance()}</div>
        <div className="wallet-balance__usd-large">{formatUSD()}</div>

        {showActions && (
          <div className="wallet-balance__actions">
            <Button onClick={handleRefresh} variant="primary" disabled={isRefreshing}>
              {isRefreshing ? 'Refreshing…' : 'Refresh Balance'}
            </Button>
          </div>
        )}
        <p className="wallet-balance__note">
          Send BTC to the subscription addresses listed in your dashboard. Balances update
          after mainnet confirmations and may take a few minutes to appear.
        </p>
      </div>
    );
  }

  // Default inline variant
  return (
    <div className="wallet-balance wallet-balance--inline">
      <span className="wallet-balance__label">Balance:</span>
      <span className="wallet-balance__amount">{formatBalance()}</span>
      <span className="wallet-balance__usd">{formatUSD()}</span>

      {showActions && (
        <Button
          size="sm"
          variant="secondary"
          onClick={handleRefresh}
          className="wallet-balance__action"
          disabled={isRefreshing}
        >
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      )}

      <p className="wallet-balance__note">
        Funds reflect confirmed Bitcoin mainnet deposits. Use the subscription-specific
        address to top up your balance.
      </p>
    </div>
  );
}