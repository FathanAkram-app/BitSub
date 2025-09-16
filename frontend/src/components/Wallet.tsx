import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { usePrice } from '../hooks/usePrice';
import { Button } from './ui/Button';

interface WalletProps {
  authClient: any;
}

export default function Wallet({ authClient }: WalletProps): React.ReactElement {
  const { balance, loading, refetch } = useWallet(authClient);
  const { convertSatsToUSD } = usePrice(authClient);

  const handleRefresh = async (): Promise<void> => {
    await refetch();
  };

  if (loading) return <div className="wallet-loading">Loading wallet...</div>;

  return (
    <div className="wallet-simple">
      <div className="wallet-info">
        <div className="wallet-label">Wallet Balance</div>
        <div className="wallet-balance">
          <span className="balance-sats">{balance.toLocaleString()} sats</span>
          <span className="balance-usd">(${convertSatsToUSD(balance)})</span>
        </div>
      </div>
      <div className="wallet-actions">
        <Button onClick={handleRefresh} size="sm" variant="secondary">
          Refresh Balance
        </Button>
      </div>
      <p className="wallet-helper">
        Send Bitcoin to the subscription addresses provided in your dashboard. Funds appear once
        transactions confirm on the Bitcoin mainnet.
      </p>
    </div>
  );
}