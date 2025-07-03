import { useState } from 'react'

export default function CreatePlanModal({ isOpen, onClose, onSubmit }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [interval, setInterval] = useState('Monthly')
  const [webhookUrl, setWebhookUrl] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title || !amount) return
    
    onSubmit({
      title,
      description: description || '',
      amount: BigInt(amount),
      interval: { [interval]: null },
      webhookUrl: webhookUrl || ''
    })
    
    setTitle('')
    setDescription('')
    setAmount('')
    setInterval('Monthly')
    setWebhookUrl('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Plan</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Plan Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter plan title"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter plan description"
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label>Amount (satoshis)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount in satoshis"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Billing Interval</label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
              className="form-select"
            >
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Webhook URL (Optional)</label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-service.com/webhook"
            />
            <small className="form-help">
              Called when subscriber pays with unique account data<br/>
              Example: https://your-service.com/api/webhooks/payment
            </small>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}