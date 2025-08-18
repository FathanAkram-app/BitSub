import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Modal, ModalContent, ModalActions } from './ui/Modal';
import { Input, TextArea, Select } from './ui/Form';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (plan: PlanData) => void;
}

interface PlanData {
  title: string;
  description: string;
  amount: bigint;
  interval: { [key: string]: null };
  webhookUrl: string;
}

export default function CreatePlanModal({ isOpen, onClose, onSubmit }: CreatePlanModalProps): React.ReactElement {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [interval, setInterval] = useState<string>('Monthly');
  const [webhookUrl, setWebhookUrl] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!title || !amount) return;
    
    onSubmit({
      title,
      description: description || '',
      amount: BigInt(amount),
      interval: { [interval]: null },
      webhookUrl: webhookUrl || ''
    });
    
    // Reset form
    setTitle('');
    setDescription('');
    setAmount('');
    setInterval('Monthly');
    setWebhookUrl('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Subscription Plan" size="lg">
      <div className="create-plan-redesign">
        <form onSubmit={handleSubmit} className="plan-form-redesign">
          {/* Plan Overview Section */}
          <div className="form-section">
            <div className="section-header">
              <span className="section-icon">📋</span>
              <div className="section-info">
                <h3>Plan Details</h3>
                <p>Define your subscription plan basics</p>
              </div>
            </div>
            
            <div className="form-grid">
              <div className="form-field-redesign">
                <label className="field-label-redesign">Plan Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Premium Access, Monthly Newsletter"
                  className="field-input-redesign"
                  required
                />
              </div>

              <div className="form-field-redesign full-width">
                <label className="field-label-redesign">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what subscribers will get..."
                  className="field-textarea-redesign"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="form-section">
            <div className="section-header">
              <span className="section-icon">💰</span>
              <div className="section-info">
                <h3>Pricing & Billing</h3>
                <p>Set your subscription pricing</p>
              </div>
            </div>
            
            <div className="form-grid">
              <div className="form-field-redesign">
                <label className="field-label-redesign">Amount (satoshis) *</label>
                <div className="amount-input-wrapper">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1000"
                    className="field-input-redesign amount-input"
                    required
                    min="1"
                  />
                  <span className="amount-suffix">sats</span>
                </div>
                <span className="field-help">Minimum 1 satoshi</span>
              </div>

              <div className="form-field-redesign">
                <label className="field-label-redesign">Billing Interval</label>
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="field-select-redesign"
                >
                  <option value="Daily">Daily</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>
            </div>
          </div>

          {/* Integration Section */}
          <div className="form-section">
            <div className="section-header">
              <span className="section-icon">🔗</span>
              <div className="section-info">
                <h3>Integration</h3>
                <p>Optional webhook for notifications</p>
              </div>
            </div>
            
            <div className="form-field-redesign full-width">
              <label className="field-label-redesign">Webhook URL</label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://your-service.com/webhook"
                className="field-input-redesign"
              />
              <span className="field-help">
                🔔 We'll notify this URL when someone subscribes or makes a payment
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="form-actions-redesign">
            <Button type="button" onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Plan
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}