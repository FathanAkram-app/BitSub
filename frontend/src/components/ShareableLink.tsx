import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/Button';
import './ShareableLink.css';

interface ShareableLinkProps {
  planId: string;
  planTitle: string;
}

export default function ShareableLink({ planId, planTitle }: ShareableLinkProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  
  const baseUrl = window.location.origin + window.location.pathname;
  const shareUrl = `${baseUrl}?subscribe=${planId}`;
  const popupUrl = `${baseUrl}?popup=${planId}`;
  const embedCode = `<iframe src="${popupUrl}" width="400" height="600" frameborder="0"></iframe>`;
  
  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)} 
        className="share-trigger-btn"
        title="Share this plan"
      >
        🔗
      </button>
    );
  }

  return createPortal(
    <div className="share-modal-overlay" onClick={() => setIsOpen(false)}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <div className="modal-title">
            <div className="modal-icon">🔗</div>
            <div>
              <h3>Share Plan</h3>
              <p>{planTitle}</p>
            </div>
          </div>
          <button className="share-close-btn" onClick={() => setIsOpen(false)}>×</button>
        </div>
        
        <div className="share-modal-content">
          <div className="share-option">
            <div className="share-option-header">
              <h4>📱 Direct Link</h4>
              <p>Share this link directly with subscribers</p>
            </div>
            <div className="share-input-group">
              <input type="text" value={shareUrl} readOnly className="share-input" />
              <button 
                onClick={() => copyToClipboard(shareUrl)} 
                className={`copy-btn ${copied ? 'copied' : ''}`}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
          
          <div className="share-option">
            <div className="share-option-header">
              <h4>🪟 Popup Widget</h4>
              <p>Opens as an overlay popup on your website</p>
            </div>
            <div className="share-input-group">
              <input type="text" value={popupUrl} readOnly className="share-input" />
              <button 
                onClick={() => copyToClipboard(popupUrl)} 
                className={`copy-btn ${copied ? 'copied' : ''}`}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </div>
          
          <div className="share-option">
            <div className="share-option-header">
              <h4>🔗 Embed Code</h4>
              <p>Add this iframe to your website</p>
            </div>
            <div className="embed-group">
              <textarea readOnly value={embedCode} rows={3} className="embed-textarea" />
              <button 
                onClick={() => copyToClipboard(embedCode)} 
                className={`copy-btn ${copied ? 'copied' : ''}`}
              >
                {copied ? '✓ Copied' : 'Copy Embed'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}