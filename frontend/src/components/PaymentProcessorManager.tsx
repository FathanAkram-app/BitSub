import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Button, Card, Loading } from './ui';
import { toast } from './ui/Toast';

interface PaymentProcessorManagerProps {
  authClient: AuthClient;
}

interface ProcessorStats {
  isRunning: boolean;
  lastProcessedCount: number;
  overdueCount: number;
  lastCheck: string;
}

export function PaymentProcessorManager({ authClient }: PaymentProcessorManagerProps): React.ReactElement {
  const [stats, setStats] = useState<ProcessorStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadProcessorStatus();
    // Refresh status every 30 seconds
    const interval = setInterval(loadProcessorStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadProcessorStatus = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Get payment processor canister
      const paymentProcessor = (window as any).ic?.plug 
        ? await (window as any).ic.plug.createActor({
            canisterId: process.env.REACT_APP_PAYMENT_PROCESSOR_CANISTER_ID,
            interfaceFactory: ({ IDL }: any) => {
              return IDL.Service({
                'getProcessorStatus': IDL.Func([], [IDL.Bool], ['query']),
              });
            },
          })
        : null;

      // Get subscription manager for overdue count
      const subscriptionManager = (window as any).ic?.plug 
        ? await (window as any).ic.plug.createActor({
            canisterId: process.env.REACT_APP_SUBSCRIPTION_MANAGER_CANISTER_ID,
            interfaceFactory: ({ IDL }: any) => {
              return IDL.Service({
                'getOverdueSubscriptionsCount': IDL.Func([], [IDL.Nat], ['query']),
              });
            },
          })
        : null;

      if (paymentProcessor && subscriptionManager) {
        const [isRunning, overdueCount] = await Promise.all([
          paymentProcessor.getProcessorStatus(),
          subscriptionManager.getOverdueSubscriptionsCount()
        ]);

        setStats({
          isRunning,
          lastProcessedCount: 0, // Would need to track this in backend
          overdueCount: Number(overdueCount),
          lastCheck: new Date().toLocaleTimeString()
        });
      } else {
        // Fallback for local development
        setStats({
          isRunning: false,
          lastProcessedCount: 0,
          overdueCount: 0,
          lastCheck: new Date().toLocaleTimeString()
        });
      }
    } catch (error) {
      console.error('Failed to load processor status:', error);
      toast.error('Failed to load payment processor status');
    } finally {
      setLoading(false);
    }
  };

  const startProcessor = async (): Promise<void> => {
    try {
      setActionLoading('start');
      
      const paymentProcessor = (window as any).ic?.plug 
        ? await (window as any).ic.plug.createActor({
            canisterId: process.env.REACT_APP_PAYMENT_PROCESSOR_CANISTER_ID,
            interfaceFactory: ({ IDL }: any) => {
              return IDL.Service({
                'startPaymentProcessor': IDL.Func([], [], []),
              });
            },
          })
        : null;

      if (paymentProcessor) {
        await paymentProcessor.startPaymentProcessor();
        toast.success('Payment processor started successfully!');
        await loadProcessorStatus();
      } else {
        toast.error('Payment processor not available');
      }
    } catch (error) {
      console.error('Failed to start processor:', error);
      toast.error('Failed to start payment processor');
    } finally {
      setActionLoading(null);
    }
  };

  const stopProcessor = async (): Promise<void> => {
    try {
      setActionLoading('stop');
      
      const paymentProcessor = (window as any).ic?.plug 
        ? await (window as any).ic.plug.createActor({
            canisterId: process.env.REACT_APP_PAYMENT_PROCESSOR_CANISTER_ID,
            interfaceFactory: ({ IDL }: any) => {
              return IDL.Service({
                'stopPaymentProcessor': IDL.Func([], [], []),
              });
            },
          })
        : null;

      if (paymentProcessor) {
        await paymentProcessor.stopPaymentProcessor();
        toast.success('Payment processor stopped');
        await loadProcessorStatus();
      } else {
        toast.error('Payment processor not available');
      }
    } catch (error) {
      console.error('Failed to stop processor:', error);
      toast.error('Failed to stop payment processor');
    } finally {
      setActionLoading(null);
    }
  };

  const triggerManualProcessing = async (): Promise<void> => {
    try {
      setActionLoading('manual');
      
      const paymentProcessor = (window as any).ic?.plug 
        ? await (window as any).ic.plug.createActor({
            canisterId: process.env.REACT_APP_PAYMENT_PROCESSOR_CANISTER_ID,
            interfaceFactory: ({ IDL }: any) => {
              return IDL.Service({
                'triggerPaymentProcessing': IDL.Func([], [IDL.Nat], []),
              });
            },
          })
        : null;

      if (paymentProcessor) {
        const processed = await paymentProcessor.triggerPaymentProcessing();
        const count = Number(processed);
        toast.success(`Processed ${count} payments manually`);
        await loadProcessorStatus();
      } else {
        toast.error('Payment processor not available');
      }
    } catch (error) {
      console.error('Failed to trigger manual processing:', error);
      toast.error('Failed to trigger manual processing');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && !stats) {
    return (
      <Card className="payment-processor-manager">
        <div className="processor-loading">
          <Loading text="Loading payment processor status..." />
        </div>
      </Card>
    );
  }

  return (
    <Card className="payment-processor-manager">
      <div className="processor-header">
        <div className="processor-title">
          <span className="processor-icon">⚡</span>
          <div>
            <h3>Payment Processor</h3>
            <p>Automatic recurring payment handling</p>
          </div>
        </div>
        <div className="processor-status">
          <div className={`status-indicator ${stats?.isRunning ? 'running' : 'stopped'}`}>
            <div className="status-dot"></div>
            <span>{stats?.isRunning ? 'Running' : 'Stopped'}</span>
          </div>
        </div>
      </div>

      <div className="processor-stats">
        <div className="stat-row">
          <div className="stat-item">
            <span className="stat-label">Overdue Subscriptions</span>
            <span className={`stat-value ${(stats?.overdueCount || 0) > 0 ? 'warning' : ''}`}>
              {stats?.overdueCount || 0}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Last Status Check</span>
            <span className="stat-value">{stats?.lastCheck || 'Never'}</span>
          </div>
        </div>
      </div>

      <div className="processor-actions">
        <div className="action-buttons">
          {stats?.isRunning ? (
            <Button
              onClick={stopProcessor}
              variant="danger"
              size="sm"
              loading={actionLoading === 'stop'}
              disabled={!!actionLoading}
            >
              ⏸️ Stop Processor
            </Button>
          ) : (
            <Button
              onClick={startProcessor}
              variant="primary"
              size="sm"
              loading={actionLoading === 'start'}
              disabled={!!actionLoading}
            >
              ▶️ Start Processor
            </Button>
          )}
          
          <Button
            onClick={triggerManualProcessing}
            variant="secondary"
            size="sm"
            loading={actionLoading === 'manual'}
            disabled={!!actionLoading}
          >
            🔄 Process Now
          </Button>
          
          <Button
            onClick={loadProcessorStatus}
            variant="secondary"
            size="sm"
            loading={loading}
            disabled={!!actionLoading}
          >
            🔍 Refresh
          </Button>
        </div>

        {(stats?.overdueCount || 0) > 0 && (
          <div className="overdue-warning">
            <span className="warning-icon">⚠️</span>
            <span>There are {stats?.overdueCount} overdue subscriptions that need processing</span>
          </div>
        )}
      </div>

      <div className="processor-info">
        <h4>How it works:</h4>
        <ul>
          <li>🔄 Runs every 60 seconds when active</li>
          <li>💰 Automatically processes overdue payments</li>
          <li>📧 Handles webhook notifications</li>
          <li>🔄 Manages recurring billing cycles</li>
        </ul>
      </div>
    </Card>
  );
}

export default PaymentProcessorManager;