import { useState, useEffect } from 'react'
import { HttpAgent, Actor } from '@dfinity/agent'
import TestnetFaucet from './TestnetFaucet'

const subscriptionCanisterId = 'bd3sg-teaaa-aaaaa-qaaba-cai'
const testnetCanisterId = 'avqkn-guaaa-aaaaa-qaaea-cai'
const host = 'http://localhost:4943'

const subscriptionIdlFactory = ({ IDL }) => {
  return IDL.Service({
    'confirmPayment' : IDL.Func([IDL.Nat], [IDL.Bool], []),
  });
};

const testnetIdlFactory = ({ IDL }) => {
  const PaymentStatus = IDL.Variant({
    'Pending' : IDL.Null,
    'Confirmed' : IDL.Null,
    'Failed' : IDL.Null
  });
  const Transaction = IDL.Record({
    'txHash' : IDL.Text,
    'address' : IDL.Text,
    'amount' : IDL.Nat64,
    'confirmations' : IDL.Nat,
    'status' : PaymentStatus,
    'timestamp' : IDL.Int,
  });
  return IDL.Service({
    'createPaymentRequest' : IDL.Func([IDL.Nat, IDL.Nat64], [IDL.Text], []),
    'monitorPayment' : IDL.Func([IDL.Text], [IDL.Opt(Transaction)], []),
    'getTransaction' : IDL.Func([IDL.Text], [IDL.Opt(Transaction)], ['query']),
    'requestTestnetFunds' : IDL.Func([IDL.Text], [IDL.Text], []),
  });
};

export default function PaymentModal({ isOpen, onClose, subscription, onPaymentComplete, authClient }) {
  const [paymentStatus, setPaymentStatus] = useState('pending')
  const [qrCode, setQrCode] = useState('')
  const [testnetAddress, setTestnetAddress] = useState('')
  const [txHash, setTxHash] = useState('')
  const [walletBalance, setWalletBalance] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('wallet')

  useEffect(() => {
    if (isOpen && subscription) {
      loadWalletBalance()
      if (paymentMethod === 'bitcoin') {
        generateQRCode()
        startPaymentMonitoring()
      }
    }
  }, [isOpen, subscription, paymentMethod])

  const loadWalletBalance = async () => {
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const walletActor = Actor.createActor(walletIdlFactory, {
        agent,
        canisterId: 'br5f7-7uaaa-aaaaa-qaaca-cai',
      })
      
      const balance = await walletActor.getBalance(identity.getPrincipal())
      setWalletBalance(Number(balance))
      
      // Auto-select payment method based on balance
      if (Number(balance) >= subscription.planAmount) {
        setPaymentMethod('wallet')
        // Auto-pay if sufficient balance
        setTimeout(() => {
          payWithWallet()
        }, 1000)
      } else {
        setPaymentMethod('bitcoin')
      }
    } catch (error) {
      console.error('Failed to load wallet balance:', error)
      setPaymentMethod('bitcoin')
    }
  }

  const walletIdlFactory = ({ IDL }) => {
    return IDL.Service({
      'getBalance' : IDL.Func([IDL.Principal], [IDL.Nat64], ['query']),
      'withdraw' : IDL.Func([IDL.Principal, IDL.Nat64], [IDL.Bool], []),
    });
  };

  const generateQRCode = async () => {
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const testnetActor = Actor.createActor(testnetIdlFactory, {
        agent,
        canisterId: testnetCanisterId,
      })
      
      // Create testnet payment request
      const address = await testnetActor.createPaymentRequest(
        Number(subscription.subscriptionId),
        BigInt(subscription.planAmount)
      )
      
      setTestnetAddress(address)
      
      const amount = (subscription.planAmount / 100000000).toFixed(8)
      const bitcoinUri = `bitcoin:${address}?amount=${amount}`
      setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bitcoinUri)}`)
    } catch (error) {
      console.error('Failed to create testnet payment:', error)
      // Fallback to original address
      const amount = (subscription.planAmount / 100000000).toFixed(8)
      const bitcoinUri = `bitcoin:${subscription.btcAddress}?amount=${amount}`
      setQrCode(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(bitcoinUri)}`)
    }
  }

  const startPaymentMonitoring = () => {
    // Monitor testnet transaction
    const interval = setInterval(async () => {
      await checkTestnetPayment()
    }, 3000) // Check every 3 seconds
    
    // Cleanup after 60 seconds
    setTimeout(() => {
      clearInterval(interval)
      if (paymentStatus === 'pending') {
        setPaymentStatus('timeout')
      }
    }, 60000)
  }
  
  const checkTestnetPayment = async () => {
    if (!testnetAddress) return
    
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const testnetActor = Actor.createActor(testnetIdlFactory, {
        agent,
        canisterId: testnetCanisterId,
      })
      
      const tx = await testnetActor.monitorPayment(testnetAddress)
      if (tx.length > 0) {
        const transaction = tx[0]
        setTxHash(transaction.txHash)
        
        if (Object.keys(transaction.status)[0] === 'Confirmed') {
          await confirmPayment(transaction.txHash)
        } else {
          setPaymentStatus('confirming')
        }
      }
    } catch (error) {
      console.error('Failed to check testnet payment:', error)
    }
  }

  const payWithWallet = async () => {
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const walletActor = Actor.createActor(walletIdlFactory, {
        agent,
        canisterId: 'br5f7-7uaaa-aaaaa-qaaca-cai',
      })
      
      // Withdraw from wallet
      const withdrawResult = await walletActor.withdraw(
        identity.getPrincipal(),
        BigInt(subscription.planAmount)
      )
      
      if (withdrawResult) {
        await confirmPayment('wallet_payment')
      } else {
        setPaymentStatus('failed')
      }
    } catch (error) {
      console.error('Wallet payment failed:', error)
      setPaymentStatus('failed')
    }
  }

  const confirmPayment = async (transactionHash) => {
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const actor = Actor.createActor(subscriptionIdlFactory, {
        agent,
        canisterId: subscriptionCanisterId,
      })
      
      const result = await actor.confirmPayment(Number(subscription.subscriptionId))
      if (result) {
        setPaymentStatus('confirmed')
        setTimeout(() => {
          onPaymentComplete()
        }, 2000)
      } else {
        setPaymentStatus('failed')
      }
    } catch (error) {
      console.error('Payment confirmation failed:', error)
      setPaymentStatus('failed')
    }
  }

  const copyAddress = () => {
    const address = testnetAddress || subscription?.btcAddress || ''
    navigator.clipboard.writeText(address)
    alert('Testnet address copied to clipboard!')
  }

  const handleFaucetRequest = async (address) => {
    try {
      const identity = authClient.getIdentity()
      const agent = new HttpAgent({ host, identity })
      await agent.fetchRootKey()
      
      const testnetActor = Actor.createActor(testnetIdlFactory, {
        agent,
        canisterId: testnetCanisterId,
      })
      
      const result = await testnetActor.requestTestnetFunds(address)
      console.log('Faucet result:', result)
    } catch (error) {
      console.error('Faucet request failed:', error)
      throw error
    }
  }

  if (!isOpen || !subscription) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Pay for Subscription</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <div className="payment-content">
          <div className="payment-info">
            <h4>{subscription.planTitle}</h4>
            <div className="payment-amount">
              {subscription.planAmount.toString()} sats
            </div>
          </div>
          
          <div className="payment-method-selector">
            <button 
              onClick={() => setPaymentMethod('wallet')}
              className={`method-btn ${paymentMethod === 'wallet' ? 'active' : ''}`}
              disabled={walletBalance < subscription.planAmount}
            >
              💰 Wallet ({walletBalance.toLocaleString()} sats)
            </button>
            <button 
              onClick={() => setPaymentMethod('bitcoin')}
              className={`method-btn ${paymentMethod === 'bitcoin' ? 'active' : ''}`}
            >
              ₿ Bitcoin
            </button>
          </div>

          {paymentMethod === 'wallet' ? (
            <div className="wallet-payment">
              <div className="wallet-info">
                <p>Pay with your wallet balance</p>
                <div className="balance-check">
                  <span>Your balance: {walletBalance.toLocaleString()} sats</span>
                  <span>Required: {subscription.planAmount.toString()} sats</span>
                </div>
              </div>
              <button 
                onClick={payWithWallet}
                disabled={walletBalance < subscription.planAmount}
                className="btn-primary wallet-pay-btn"
              >
                Pay with Wallet
              </button>
            </div>
          ) : (
            <div className="payment-methods">
              <div className="qr-section">
                <h5>Scan QR Code</h5>
                <img src={qrCode} alt="Bitcoin QR Code" className="qr-code" />
              </div>
              
              <div className="address-section">
                <h5>Bitcoin Testnet Address</h5>
                <div className="address-display">
                  <code>{testnetAddress || subscription.btcAddress}</code>
                  <button onClick={copyAddress} className="copy-btn">Copy</button>
                </div>
                <small className="testnet-note">⚠️ This is a testnet address - use testnet Bitcoin only</small>
              </div>
              
              <TestnetFaucet 
                address={testnetAddress || subscription.btcAddress}
                onFaucetRequest={handleFaucetRequest}
              />
            </div>
          )}

          <div className="payment-status">
            {paymentStatus === 'pending' && (
              <div className="status-pending">
                <div className="spinner"></div>
                <p>Waiting for testnet payment...</p>
              </div>
            )}
            {paymentStatus === 'confirming' && (
              <div className="status-pending">
                <div className="spinner"></div>
                <p>Payment detected! Waiting for confirmations...</p>
                {txHash && <small>TX: {txHash.slice(0, 20)}...</small>}
              </div>
            )}
            {paymentStatus === 'confirmed' && (
              <div className="status-confirmed">
                <div className="checkmark">✓</div>
                <p>Payment confirmed!</p>
                <p className="success-message">Subscription updated successfully</p>
              </div>
            )}
            {paymentStatus === 'failed' && (
              <div className="status-failed">
                <div className="error-mark">✗</div>
                <p>Payment failed. Please try again.</p>
              </div>
            )}
            {paymentStatus === 'timeout' && (
              <div className="status-failed">
                <div className="error-mark">✗</div>
                <p>Payment timeout. Please try again or check your transaction.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}