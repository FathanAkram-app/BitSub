import { useState, useEffect } from 'react'
import { HttpAgent, Actor } from '@dfinity/agent'

const walletCanisterId = 'br5f7-7uaaa-aaaaa-qaaca-cai'
const host = 'http://localhost:4943'

const walletIdlFactory = ({ IDL }) => {
  return IDL.Service({
    'getBalance' : IDL.Func([IDL.Principal], [IDL.Nat64], ['query']),
    'deposit' : IDL.Func([IDL.Principal, IDL.Nat64], [IDL.Bool], []),
    'withdraw' : IDL.Func([IDL.Principal, IDL.Nat64], [IDL.Bool], []),
  });
};

export default function WalletBalance({ authClient, onBalanceUpdate }) {
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [depositAmount, setDepositAmount] = useState('')
  const [showDeposit, setShowDeposit] = useState(false)

  useEffect(() => {
    loadBalance()
  }, [])

  const loadBalance = async () => {
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(walletIdlFactory, {
        agent,
        canisterId: walletCanisterId,
      })
      
      const userBalance = await actor.getBalance(identity.getPrincipal())
      setBalance(Number(userBalance))
      if (onBalanceUpdate) onBalanceUpdate(Number(userBalance))
    } catch (error) {
      console.error('Failed to load balance:', error)
      setBalance(0)
    } finally {
      setLoading(false)
    }
  }

  const handleDeposit = async () => {
    if (!depositAmount || isNaN(depositAmount)) return
    
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(walletIdlFactory, {
        agent,
        canisterId: walletCanisterId,
      })
      
      const result = await actor.deposit(identity.getPrincipal(), BigInt(depositAmount))
      if (result) {
        setDepositAmount('')
        setShowDeposit(false)
        await loadBalance()
      }
    } catch (error) {
      console.error('Deposit failed:', error)
    }
  }

  const formatBalance = (sats) => {
    return (sats / 100000000).toFixed(8) + ' BTC'
  }

  if (loading) {
    return (
      <div className="wallet-balance loading">
        <div className="balance-spinner"></div>
      </div>
    )
  }

  return (
    <div className="wallet-balance">
      <div className="balance-display">
        <div className="balance-label">Wallet Balance</div>
        <div className="balance-amount">
          <span className="sats">{balance.toLocaleString()} sats</span>
          <span className="btc">({formatBalance(balance)})</span>
        </div>
      </div>
      
      <div className="balance-actions">
        <button 
          onClick={() => setShowDeposit(!showDeposit)}
          className="btn-secondary deposit-btn"
        >
          💰 Add Funds
        </button>
        <button 
          onClick={loadBalance}
          className="btn-secondary refresh-btn"
        >
          🔄
        </button>
      </div>

      {showDeposit && (
        <div className="deposit-form">
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Amount in sats"
            className="deposit-input"
          />
          <button 
            onClick={handleDeposit}
            disabled={!depositAmount}
            className="btn-primary deposit-submit"
          >
            Deposit
          </button>
        </div>
      )}
    </div>
  )
}