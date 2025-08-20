import React, { useState } from 'react';
import { useWallet } from '../hooks/useWallet';
import { usePrice } from '../hooks/usePrice';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
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
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const { balance, loading, deposit } = useWallet(authClient);
  const { convertSatsToUSD } = usePrice(authClient);

  const handleDeposit = async (): Promise<void> => {
    if (depositAmount && !isNaN(Number(depositAmount))) {
      const success = await deposit(Number(depositAmount));
      if (success) {
        setDepositAmount('');
        setIsDepositModalOpen(false);
      }
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
            onClick={() => setIsDepositModalOpen(true)}
            title="Add funds"
          >
            +
          </button>
        )}
        
        <Modal 
          isOpen={isDepositModalOpen} 
          onClose={() => setIsDepositModalOpen(false)}
          title="Add Funds"
        >
          <div className="deposit-modal">
            <div className="form-field">
              <label htmlFor="amount">Amount (sats)</label>
              <input
                id="amount"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount in satoshis"
                min="1"
              />
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setIsDepositModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDeposit} disabled={!depositAmount}>
                Deposit
              </Button>
            </div>
          </div>
        </Modal>
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
            <Button onClick={() => setIsDepositModalOpen(true)} variant="primary">
              Add Funds
            </Button>
          </div>
        )}
        
        <Modal 
          isOpen={isDepositModalOpen} 
          onClose={() => setIsDepositModalOpen(false)}
          title="Add Funds to Wallet"
        >
          <div className="deposit-modal">
            <div className="current-balance">
              Current Balance: {formatBalance()} {formatUSD()}
            </div>
            <div className="form-field">
              <label htmlFor="amount">Amount (sats)</label>
              <input
                id="amount"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter amount in satoshis"
                min="1"
              />
            </div>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setIsDepositModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDeposit} disabled={!depositAmount}>
                Deposit
              </Button>
            </div>
          </div>
        </Modal>
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
          onClick={() => setIsDepositModalOpen(true)}
          className="wallet-balance__action"
        >
          Add Funds
        </Button>
      )}
      
      <Modal 
        isOpen={isDepositModalOpen} 
        onClose={() => setIsDepositModalOpen(false)}
        title="Add Funds"
      >
        <div className="deposit-modal">
          <div className="form-field">
            <label htmlFor="amount">Amount (sats)</label>
            <input
              id="amount"
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Enter amount in satoshis"
              min="1"
            />
          </div>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setIsDepositModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDeposit} disabled={!depositAmount}>
              Deposit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}