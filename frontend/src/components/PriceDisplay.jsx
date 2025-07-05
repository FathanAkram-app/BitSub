import { usePrice } from '../hooks/usePrice'

export default function PriceDisplay({ sats, showBTC = true }) {
  const { btcPrice, convertSatsToUSD, loading } = usePrice()

  if (loading) {
    return (
      <div className="price-display">
        <div className="sats-amount">{Number(sats).toLocaleString()} sats</div>
        <div className="usd-amount loading">Loading USD...</div>
      </div>
    )
  }

  return (
    <div className="price-display">
      <div className="sats-amount">{Number(sats).toLocaleString()} sats</div>
      <div className="usd-amount">${convertSatsToUSD(sats)}</div>
      {showBTC && (
        <div className="btc-price">BTC: ${Number(btcPrice).toLocaleString()}</div>
      )}
    </div>
  )
}