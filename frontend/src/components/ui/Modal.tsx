import React, { useEffect } from 'react';
import { ModalProps } from '../../types';

interface ModalContentProps {
  children: React.ReactNode;
}

interface ModalActionsProps {
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps): React.ReactElement | null {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {title && (
          <div className="modal-header">
            <h3 id="modal-title">{title}</h3>
            <button 
              onClick={onClose} 
              className="close-btn"
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ModalContent({ children }: ModalContentProps): React.ReactElement {
  return <div className="modal-content">{children}</div>;
}

export function ModalActions({ children }: ModalActionsProps): React.ReactElement {
  return <div className="form-actions">{children}</div>;
}