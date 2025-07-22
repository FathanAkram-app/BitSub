import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps): React.ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!notification.persistent && notification.duration !== 0) {
      const duration = notification.duration || 5000;
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.persistent]);

  const handleDismiss = (): void => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const getIcon = (): string => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  const getTypeClass = (): string => {
    return `notification-${notification.type}`;
  };

  return (
    <div 
      className={`notification-item ${getTypeClass()} ${isVisible ? 'visible' : ''} ${isLeaving ? 'leaving' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className="notification-icon">
        {getIcon()}
      </div>
      
      <div className="notification-content">
        <div className="notification-title">{notification.title}</div>
        <div className="notification-message">{notification.message}</div>
        
        {notification.action && (
          <div className="notification-action">
            <Button
              onClick={notification.action.onClick}
              variant="secondary"
              size="sm"
            >
              {notification.action.label}
            </Button>
          </div>
        )}
      </div>
      
      <button
        className="notification-close"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  maxVisible?: number;
}

export function NotificationSystem({ 
  notifications, 
  onDismiss, 
  maxVisible = 5 
}: NotificationSystemProps): React.ReactElement {
  const visibleNotifications = notifications.slice(0, maxVisible);

  return (
    <div className="notification-system" aria-live="polite" aria-label="Notifications">
      {visibleNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>): void => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: Notification = {
      ...notification,
      id,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const removeNotification = useCallback((id: string): void => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback((): void => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((title: string, message: string, options?: Partial<Notification>): void => {
    addNotification({
      type: 'success',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string, options?: Partial<Notification>): void => {
    addNotification({
      type: 'error',
      title,
      message,
      persistent: true, // Errors should be persistent by default
      ...options,
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string, options?: Partial<Notification>): void => {
    addNotification({
      type: 'warning',
      title,
      message,
      duration: 8000, // Warnings should stay longer
      ...options,
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string, options?: Partial<Notification>): void => {
    addNotification({
      type: 'info',
      title,
      message,
      ...options,
    });
  }, [addNotification]);

  // Payment-specific notifications
  const showPaymentSuccess = useCallback((amount: number, planTitle: string): void => {
    showSuccess(
      'Payment Successful',
      `Payment of ${amount.toLocaleString()} sats for "${planTitle}" was processed successfully.`,
      {
        action: {
          label: 'View Transaction',
          onClick: () => {
            // Navigate to transaction history
            console.log('Navigate to transaction history');
          }
        }
      }
    );
  }, [showSuccess]);

  const showPaymentFailed = useCallback((reason: string): void => {
    showError(
      'Payment Failed',
      `Your payment could not be processed: ${reason}`,
      {
        action: {
          label: 'Retry Payment',
          onClick: () => {
            // Retry payment logic
            console.log('Retry payment');
          }
        }
      }
    );
  }, [showError]);

  const showSubscriptionCreated = useCallback((planTitle: string): void => {
    showSuccess(
      'Subscription Created',
      `You have successfully subscribed to "${planTitle}". Your first payment will be processed automatically.`
    );
  }, [showSuccess]);

  const showLowBalance = useCallback((currentBalance: number, requiredAmount: number): void => {
    showWarning(
      'Insufficient Balance',
      `Your balance of ${currentBalance.toLocaleString()} sats is insufficient for the payment of ${requiredAmount.toLocaleString()} sats.`,
      {
        action: {
          label: 'Add Funds',
          onClick: () => {
            // Navigate to wallet
            console.log('Navigate to wallet');
          }
        }
      }
    );
  }, [showWarning]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    // Payment-specific methods
    showPaymentSuccess,
    showPaymentFailed,
    showSubscriptionCreated,
    showLowBalance,
  };
}