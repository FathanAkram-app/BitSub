import React from 'react';
import { useWallet } from '../hooks/useWallet';
import { usePrice } from '../hooks/usePrice';
import { Button } from './ui/Button';

interface WalletProps {
  authClient: any;
}

export default function Wallet({ authClient }: WalletProps): React.ReactElement {
  const { balance, loading, deposit } = useWallet(authClient);
  const { convertSatsToUSD } = usePrice(authClient);

  const handleDeposit = async (): Promise<void> => {
    const amount = prompt('Enter amount in sats:');
    if (amount && !isNaN(Number(amount))) {
      await deposit(Number(amount));
    }
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
      <Button onClick={handleDeposit} size="sm" variant="secondary">
        Add Funds
      </Button>
    </div>
  );
}