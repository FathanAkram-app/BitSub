import { useState } from 'react'

export default function PlanCard({ plan, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  
  const getIntervalText = (interval) => {
    if (interval.Daily !== undefined) return 'day'
    if (interval.Monthly !== undefined) return 'month'
    if (interval.Yearly !== undefined) return 'year'
    return 'month'
  }

  const handleDelete = async () => {
    if (!confirm(`Delete "${plan.title}"? This cannot be undone.`)) return
    
    setDeleting(true)
    try {
      await onDelete(plan.planId)
    } catch (error) {
      alert('Failed to delete plan')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="plan-card">
      <h4>{plan.title}</h4>
      <p>{plan.description}</p>
      <div className="plan-amount">
        {plan.amount.toString()} sats/{getIntervalText(plan.interval)}
      </div>
      <div className="plan-id">ID: {plan.planId}</div>
      <button 
        onClick={handleDelete}
        disabled={deleting}
        className="btn-danger delete-btn"
      >
        {deleting ? 'Deleting...' : '🗑️ Delete'}
      </button>
    </div>
  )
}