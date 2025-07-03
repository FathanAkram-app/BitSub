import { useState } from 'react'

export default function TestnetFaucet({ address, onFaucetRequest }) {
  const [requesting, setRequesting] = useState(false)
  const [requested, setRequested] = useState(false)

  const handleFaucetRequest = async () => {
    setRequesting(true)
    try {
      await onFaucetRequest(address)
      setRequested(true)
    } catch (error) {
      console.error('Faucet request failed:', error)
    } finally {
      setRequesting(false)
    }
  }

  if (requested) {
    return (
      <div className="faucet-success">
        <p>✅ Testnet coins requested!</p>
        <small>Check your address in 2-3 minutes</small>
      </div>
    )
  }

  return (
    <div className="testnet-faucet">
      <h5>Need Testnet Coins?</h5>
      <p>Get free testnet Bitcoin to test payments</p>
      <button 
        onClick={handleFaucetRequest}
        disabled={requesting}
        className="btn-secondary faucet-btn"
      >
        {requesting ? 'Requesting...' : '🚰 Get Test Coins'}
      </button>
      <div className="faucet-links">
        <p>Or use these testnet faucets:</p>
        <a href="https://coinfaucet.eu/en/btc-testnet/" target="_blank" rel="noopener noreferrer">
          CoinFaucet.eu
        </a>
        <a href="https://testnet-faucet.mempool.co/" target="_blank" rel="noopener noreferrer">
          Mempool Testnet
        </a>
      </div>
    </div>
  )
}