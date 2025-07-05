import { useState } from 'react'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import './ShareableLink.css'

export default function ShareableLink({ planId, planTitle }) {
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

  return (
    <Card className="shareable-link">
      <CardContent>
        <h4>Share This Plan</h4>
        
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
      </CardContent>
    </Card>
  )
}