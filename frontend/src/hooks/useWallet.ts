import { useState, useEffect, useCallback } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { walletService } from '../services/walletService';
import { useRealtime } from './useRealtime';

interface UseWalletReturn {
  balance: number;
  loading: boolean;
  error: string | null;
  deposit: (amount: number) => Promise<boolean>;
  withdraw: (amount: number) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useWallet(authClient: AuthClient | undefined): UseWalletReturn {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = async (): Promise<void> => {
    if (!authClient) return;
    
    try {
      setError(null);
      
      const walletBalance = await walletService.getBalance(authClient);
      // Only update if balance actually changed
      if (walletBalance !== balance) {
        setBalance(walletBalance);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deposit = async (amount: number): Promise<boolean> => {
    try {
      const result = await walletService.deposit(authClient!, amount);
      if (result) {
        await loadWallet();
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const withdraw = async (amount: number): Promise<boolean> => {
    try {
      const result = await walletService.withdraw(authClient!, amount);
      if (result) {
        await loadWallet();
      }
      return result;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  };

  const refreshWallet = useCallback(() => {
    loadWallet();
  }, [authClient]);
  
  useRealtime(refreshWallet, 5000);
  
  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  return {
    balance,
    loading,
    error,
    deposit,
    withdraw,
    refetch: loadWallet
  };
}