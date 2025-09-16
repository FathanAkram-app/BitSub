import { useState, useEffect, useCallback } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { walletService } from '../services/walletService';
import { useRealtime } from './useRealtime';

interface UseWalletReturn {
  balance: number;
  loading: boolean;
  error: string | null;
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
      
      const refreshedBalance = await walletService.refreshBalance(authClient);
      if (refreshedBalance !== balance) {
        setBalance(refreshedBalance);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
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
    refetch: loadWallet
  };
}