import { IDL } from '@dfinity/candid';
import { AuthClient } from '@dfinity/auth-client';
import { ENV } from '../config/env';
import { apiService } from './api';

interface PriceData {
  symbol: string;
  price: number;
  timestamp: bigint;
}

type PriceResult = { ok: PriceData } | { err: string };

const idlFactory = ({ IDL }: { IDL: any }) => {
  const PriceData = IDL.Record({
    'symbol': IDL.Text,
    'price': IDL.Float64,
    'timestamp': IDL.Int,
  });
  const Result = IDL.Variant({ 'ok': PriceData, 'err': IDL.Text });
  return IDL.Service({
    'getBTCPrice': IDL.Func([], [Result], []),
  });
};

export class PriceService {
  private canisterId: string;

  constructor() {
    this.canisterId = ENV.CANISTER_IDS.OKX_INTEGRATION;
  }

  async getActor(authClient: AuthClient): Promise<any> {
    return apiService.getActor(this.canisterId, idlFactory, authClient);
  }

  async getBTCPrice(authClient?: AuthClient): Promise<number> {
    try {
      if (!authClient) return 43250.0;
      
      const actor = await this.getActor(authClient);
      const result: PriceResult = await actor.getBTCPrice();
      
      if ('ok' in result && result.ok && result.ok.price) {
        return Number(result.ok.price) || 43250.0;
      }
      return 43250.0; // fallback
    } catch (error: any) {
      console.warn('OKX API failed:', error.message);
      return 43250.0; // fallback
    }
  }

  convertSatsToUSD(sats: number | bigint, btcPrice: number): string {
    try {
      if (!sats || sats === 0) return '0.00';
      if (!btcPrice || btcPrice === 0) return '0.00';
      
      const btcAmount = Number(sats) / 100000000;
      const usdValue = btcAmount * Number(btcPrice);
      
      if (isNaN(usdValue) || !isFinite(usdValue)) return '0.00';
      
      return usdValue.toFixed(2);
    } catch (error) {
      console.warn('USD conversion failed:', error);
      return '0.00';
    }
  }
}

export const priceService = new PriceService();