import { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { priceService } from '../services/priceService';

export interface UsePriceReturn {
  btcPrice: number;
  loading: boolean;
  error: string | null;
  convertSatsToUSD: (sats: number) => string;
  refetch: () => Promise<void>;
}

export function usePrice(authClient: AuthClient | undefined): UsePriceReturn {
  const [btcPrice, setBtcPrice] = useState<number>(43250.0); // Start with fallback
  const [loading, setLoading] = useState<boolean>(false); // Don't block UI
  const [error, setError] = useState<string | null>(null);

  const loadPrice = async (): Promise<void> => {
    if (!authClient) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const price = await priceService.getBTCPrice(authClient);
      setBtcPrice(price || 43250.0); // Fallback price
    } catch (err: any) {
      console.warn('OKX price failed, using fallback:', err.message);
      setBtcPrice(43250.0); // Fallback price
      setError(null); // Don't show error to user
    } finally {
      setLoading(false);
    }
  };

  const convertSatsToUSD = (sats: number): string => {
    if (!sats || sats === 0) return '0.00';
    const price = btcPrice || 43250.0; // Always have fallback
    return priceService.convertSatsToUSD(sats, price);
  };

  useEffect(() => {
    if (!authClient) return;
    
    // Delay initial load to not block UI
    const timeout = setTimeout(() => {
      loadPrice();
      const interval = setInterval(loadPrice, 30000); // Update every 30s
      return () => clearInterval(interval);
    }, 2000); // Wait 2 seconds before first load
    
    return () => clearTimeout(timeout);
  }, [authClient]);

  return {
    btcPrice,
    loading,
    error,
    convertSatsToUSD,
    refetch: loadPrice
  };
}