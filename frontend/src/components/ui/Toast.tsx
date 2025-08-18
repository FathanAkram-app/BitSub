import React, { useEffect, useState } from 'react';

export interface ToastProps {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ 
  id, 
  title, 
  message, 
  type, 
  duration = 5000, 
  onClose 
}: ToastProps): React.ReactElement {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose(id), 150);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 150);
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  return (
    <div 
      className={`toast toast-${type} ${isVisible ? 'fade-in' : 'fade-out'}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        transition: 'all 150ms ease-out'
      }}
    >
      <div className="toast-content">
        <div className="flex items-center gap-3">
          <span className="text-lg">{getIcon()}</span>
          <div className="flex-1">
            {title && <div className="toast-title">{title}</div>}
            <div className="toast-message">{message}</div>
          </div>
          <button
            onClick={handleClose}
            className="modal-close"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

interface ToastState {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

class ToastManager {
  private toasts: ToastState[] = [];
  private listeners: ((toasts: ToastState[]) => void)[] = [];

  subscribe(listener: (toasts: ToastState[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  show(toast: Omit<ToastState, 'id'>) {
    const newToast: ToastState = {
      ...toast,
      id: Math.random().toString(36).substring(2, 9)
    };
    
    this.toasts.push(newToast);
    this.notify();
    
    return newToast.id;
  }

  hide(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  }

  success(message: string, title?: string, duration?: number) {
    return this.show({ type: 'success', message, title, duration });
  }

  error(message: string, title?: string, duration?: number) {
    return this.show({ type: 'error', message, title, duration });
  }

  warning(message: string, title?: string, duration?: number) {
    return this.show({ type: 'warning', message, title, duration });
  }

  info(message: string, title?: string, duration?: number) {
    return this.show({ type: 'info', message, title, duration });
  }
}

export const toast = new ToastManager();

export function ToastContainer(): React.ReactElement {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  useEffect(() => {
    return toast.subscribe(setToasts);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((toastData) => (
        <Toast
          key={toastData.id}
          {...toastData}
          onClose={toast.hide.bind(toast)}
        />
      ))}
    </div>
  );
}