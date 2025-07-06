import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './ui/Button'
import './ShareableLink.css'

export default function ShareableLink({ planId, planTitle }) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const baseUrl = window.location.origin + window.location.pathname
  const shareUrl = `${baseUrl}?subscribe=${planId}`
  const popupUrl = `${baseUrl}?popup=${planId}`
  const embedCode = `<iframe src="${popupUrl}" width="400" height="600" frameborder="0"></iframe>`
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} variant="secondary" size="small">
        🔗 Share
      </Button>
    )
  }

  return createPortal(
    <div className="modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share Plan: {planTitle}</h3>
          <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
        </div>
        <div className="modal-form">
          <div className="link-option">
            <label>Direct Link:</label>
            <div className="link-input">
              <input type="text" value={shareUrl} readOnly />
              <Button onClick={() => copyToClipboard(shareUrl)} size="small">
                {copied ? '✓' : 'Copy'}
              </Button>
            </div>
          </div>
          
          <div className="link-option">
            <label>Popup Widget:</label>
            <div className="link-input">
              <input type="text" value={popupUrl} readOnly />
              <Button onClick={() => copyToClipboard(popupUrl)} size="small">
                {copied ? '✓' : 'Copy'}
              </Button>
            </div>
            <small>Opens as popup overlay</small>
          </div>
          
          <div className="embed-code">
            <label>Embed Code:</label>
            <textarea readOnly value={embedCode} rows="3" />
            <Button onClick={() => copyToClipboard(embedCode)} size="small">
              Copy Embed
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}