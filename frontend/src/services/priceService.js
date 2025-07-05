import { ENV } from '../config/env'
import { apiService } from './api'

const idlFactory = ({ IDL }) => {
  const PriceData = IDL.Record({
    'symbol' : IDL.Text,
    'price' : IDL.Float64,
    'timestamp' : IDL.Int,
  });
  const Result = IDL.Variant({ 'ok' : PriceData, 'err' : IDL.Text });
  return IDL.Service({
    'getBTCPrice' : IDL.Func([], [Result], []),
  });
};

export class PriceService {
  constructor() {
    this.canisterId = ENV.CANISTER_IDS.OKX_INTEGRATION
  }

  async getActor(authClient) {
    return apiService.getActor(this.canisterId, idlFactory, authClient)
  }

  async getBTCPrice(authClient) {
    try {
      if (!authClient) return 43250.0
      
      const actor = await this.getActor(authClient)
      const result = await actor.getBTCPrice()
      
      if ('ok' in result && result.ok && result.ok.price) {
        return Number(result.ok.price) || 43250.0
      }
      return 43250.0 // fallback
    } catch (error) {
      console.warn('OKX API failed:', error.message)
      return 43250.0 // fallback
    }
  }

  convertSatsToUSD(sats, btcPrice) {
    try {
      if (!sats || sats === 0) return '0.00'
      if (!btcPrice || btcPrice === 0) return '0.00'
      
      const btcAmount = Number(sats) / 100000000
      const usdValue = btcAmount * Number(btcPrice)
      
      if (isNaN(usdValue) || !isFinite(usdValue)) return '0.00'
      
      return usdValue.toFixed(2)
    } catch (error) {
      console.warn('USD conversion failed:', error)
      return '0.00'
    }
  }
}

export const priceService = new PriceService()