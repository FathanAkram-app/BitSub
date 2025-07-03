import { useState, useEffect } from 'react'
import { HttpAgent, Actor } from '@dfinity/agent'

const okxCanisterId = 'a3shf-5eaaa-aaaaa-qaafa-cai'
const host = 'http://localhost:4943'

const okxIdlFactory = ({ IDL }) => {
  const PriceData = IDL.Record({
    'symbol' : IDL.Text,
    'price' : IDL.Float64,
    'timestamp' : IDL.Int,
  });
  const Result = IDL.Variant({ 'ok' : PriceData, 'err' : IDL.Text });
  return IDL.Service({
    'getBTCPrice' : IDL.Func([], [Result], []),
    'convertSatsToUSD' : IDL.Func([IDL.Nat], [IDL.Variant({ 'ok' : IDL.Float64, 'err' : IDL.Text })], []),
  });
};

export default function OKXPriceWidget({ authClient }) {
  const [btcPrice, setBtcPrice] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBTCPrice()
    const interval = setInterval(loadBTCPrice, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const loadBTCPrice = async () => {
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(okxIdlFactory, {
        agent,
        canisterId: okxCanisterId,
      })
      
      const result = await actor.getBTCPrice()
      if ('ok' in result) {
        setBtcPrice(result.ok.price)
      }
    } catch (error) {
      console.error('Failed to load BTC price:', error)
    } finally {
      setLoading(false)
    }
  }

  const convertSatsToUSD = (sats) => {
    const btcAmount = sats / 100000000
    return (btcAmount * btcPrice).toFixed(2)
  }

  if (loading) return <div className="okx-widget loading">Loading price...</div>

  return (
    <div className="okx-price-widget">
      <div className="price-header">
        <span className="okx-logo">🟠 OKX</span>
        <span className="live-indicator">🔴 LIVE</span>
      </div>
      <div className="btc-price">
        <span className="price-label">BTC/USDT</span>
        <span className="price-value">${btcPrice.toLocaleString()}</span>
      </div>
      <div className="conversion-helper">
        <small>100k sats ≈ ${convertSatsToUSD(100000)}</small>
      </div>
    </div>
  )
}