import { useState } from 'react'

export default function SubscriptionManagement({ subscription, onCancel, onPause, onResume }) {
  const [showActions, setShowActions] = useState(false)
  const [canceling, setCanceling] = useState(false)

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#00ff88'
      case 'Paused': return '#ffc107'
      case 'Canceled': return '#ff6b6b'
      default: return '#a0a0a0'
    }
  }

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString()
  }

  const handleAction = async (action) => {
    switch (action) {
      case 'cancel':
        if (confirm('Delete this subscription permanently? This cannot be undone.')) {
          setCanceling(true)
          try {
            await onCancel(subscription.subscriptionId)
          } finally {
            setCanceling(false)
          }
        }
        break
      case 'pause':
        onPause(subscription.subscriptionId)
        break
      case 'resume':
        onResume(subscription.subscriptionId)
        break
    }
    setShowActions(false)
  }

  return (
    <div className="subscription-management">
      <div className="subscription-header">
        <h4>{subscription.planTitle}</h4>
        <div 
          className="status-badge"
          style={{ backgroundColor: getStatusColor(Object.keys(subscription.status)[0]) }}
        >
          {Object.keys(subscription.status)[0]}
        </div>
      </div>

      <div className="subscription-details">
        <div className="detail-row">
          <span>Amount:</span>
          <span className="amount">{subscription.planAmount.toString()} sats</span>
        </div>
        <div className="detail-row">
          <span>Next Payment:</span>
          <span>{formatDate(subscription.nextPayment)}</span>
        </div>
        <div className="detail-row">
          <span>Bitcoin Address:</span>
          <code className="btc-address">{subscription.btcAddress}</code>
        </div>
        <div className="detail-row">
          <span>Subscription ID:</span>
          <span className="sub-id">{subscription.subscriptionId}</span>
        </div>
      </div>

      <div className="subscription-actions">
        <button 
          onClick={() => setShowActions(!showActions)}
          className="btn-secondary manage-btn"
        >
          Manage ⚙️
        </button>
        
        {showActions && (
          <div className="action-menu">
            {Object.keys(subscription.status)[0] === 'Active' && (
              <button 
                onClick={() => handleAction('pause')}
                className="action-btn pause-btn"
              >
                ⏸️ Pause
              </button>
            )}
            {Object.keys(subscription.status)[0] === 'Paused' && (
              <button 
                onClick={() => handleAction('resume')}
                className="action-btn resume-btn"
              >
                ▶️ Resume
              </button>
            )}
            <button 
              onClick={() => handleAction('cancel')}
              disabled={canceling}
              className="action-btn cancel-btn"
            >
              {canceling ? 'Deleting...' : '🗑️ Delete'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}