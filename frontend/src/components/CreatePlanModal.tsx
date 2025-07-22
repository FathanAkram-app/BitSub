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
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Plan">
      <ModalContent>
        <form onSubmit={handleSubmit} className="modal-form">
          <Input
            label="Plan Title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter plan title"
            required
          />
          
          <TextArea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter plan description"
            rows={3}
          />
          
          <Input
            label="Amount (satoshis)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount in satoshis"
            required
          />
          
          <Select
            label="Billing Interval"
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            options={[
              { value: 'Daily', label: 'Daily' },
              { value: 'Monthly', label: 'Monthly' },
              { value: 'Yearly', label: 'Yearly' }
            ]}
          />
          
          <Input
            label="Webhook URL (Optional)"
            type="url"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://your-service.com/webhook"
            help="Called when subscriber pays with unique account data"
          />
          
          <ModalActions>
            <Button type="button" onClick={onClose} variant="secondary">
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Plan
            </Button>
          </ModalActions>
        </form>
      </ModalContent>
    </Modal>
  );
}