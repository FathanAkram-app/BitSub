import { useState } from 'react'

export default function PaymentButton({ subscription, onPaymentStart }) {
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePayment = async () => {
    setIsProcessing(true)
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000))
      onPaymentStart(subscription)
    } catch (error) {
      console.error('Payment start failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getButtonText = () => {
    if (isProcessing) return 'Processing...'
    
    const status = Object.keys(subscription.status)[0]
    switch (status) {
      case 'Active':
        return 'Pay Now'
      case 'Paused':
        return 'Resume & Pay'
      case 'Canceled':
        return 'Reactivate'
      default:
        return 'Pay Now'
    }
  }

  const getButtonClass = () => {
    const status = Object.keys(subscription.status)[0]
    const baseClass = 'btn-primary pay-btn'
    
    if (isProcessing) return `${baseClass} processing`
    if (status === 'Paused') return `${baseClass} resume`
    if (status === 'Canceled') return `${baseClass} reactivate`
    
    return baseClass
  }

  return (
    <button 
      onClick={handlePayment}
      disabled={isProcessing}
      className={getButtonClass()}
    >
      {getButtonText()}
    </button>
  )
}