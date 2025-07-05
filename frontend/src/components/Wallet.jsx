import { useWallet } from '../hooks/useWallet'
import { usePrice } from '../hooks/usePrice'
import { Card, CardContent } from './ui/Card'
import { Button } from './ui/Button'

export default function Wallet({ authClient }) {
  const { balance, loading, deposit } = useWallet(authClient)
  const { btcPrice, convertSatsToUSD } = usePrice(authClient)

  const handleDeposit = async () => {
    const amount = prompt('Enter amount in sats:')
    if (amount && !isNaN(amount)) {
      await deposit(Number(amount))
    }
  }

  if (loading) return <div className="loading">Loading wallet...</div>

  return (
    <Card className="wallet-card">
      <CardContent>
        <h3>💰 Wallet</h3>
        <div className="wallet-balance">
          <div className="balance-amount">{balance.toLocaleString()} sats</div>
          <div className="balance-usd">${convertSatsToUSD(balance)}</div>
        </div>
        <div className="btc-price">BTC: ${btcPrice.toLocaleString()}</div>
        <Button onClick={handleDeposit}>Add Funds</Button>
      </CardContent>
    </Card>
  )
}