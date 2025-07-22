import React from 'react';
import { usePrice } from '../hooks/usePrice';

interface PriceDisplayProps {
  sats: number | bigint;
  showBTC?: boolean;
}

export default function PriceDisplay({ sats, showBTC = true }: PriceDisplayProps): React.ReactElement {
  const { btcPrice, convertSatsToUSD, loading } = usePrice();

  if (loading) {
    return (
      <div className="price-display">
        <div className="sats-amount">{Number(sats).toLocaleString()} sats</div>
        <div className="usd-amount loading">Loading USD...</div>
      </div>
    );
  }

  return (
    <div className="price-display">
      <div className="sats-amount">{Number(sats).toLocaleString()} sats</div>
      <div className="usd-amount">${convertSatsToUSD(sats)}</div>
      {showBTC && (
        <div className="btc-price">BTC: ${Number(btcPrice).toLocaleString()}</div>
      )}
    </div>
  );
}