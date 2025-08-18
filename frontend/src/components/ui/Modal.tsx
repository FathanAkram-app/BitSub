import React, { useEffect } from 'react';
import { ModalProps } from '../../types';

interface ModalContentProps {
  children: React.ReactNode;
}

interface ModalActionsProps {
  children: React.ReactNode;
}

interface ExtendedModalProps extends ModalProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Modal({ 
  isOpen, 
  onClose, 
  children, 
  title, 
  size = 'md',
  className = '' 
}: ExtendedModalProps): React.ReactElement | null {
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

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div 
        className={`modal ${sizeClasses[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {title && (
          <div className="modal-header">
            <h2 className="modal-title" id="modal-title">{title}</h2>
            <button 
              onClick={onClose} 
              className="modal-close"
              aria-label="Close modal"
              type="button"
            >
              ✕
            </button>
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
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