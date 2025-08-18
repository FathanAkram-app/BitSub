import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui';
import { useNotifications } from './NotificationSystem';
import { subscriptionService } from '../services/subscriptionService';
import { AuthClient } from '@dfinity/auth-client';
import './WebhookManager.css';

// Add global type augmentation for window.ic
declare global {
  interface Window {
    ic?: any;
  }
}

export interface WebhookConfig {
  url: string;
  secret: string;
  events: WebhookEventType[];
  isActive: boolean;
}

export interface WebhookEvent {
  id: string;
  eventType: WebhookEventType;
  subscriptionId: number;
  planId: string;
  status: 'pending' | 'sent' | 'failed';
  timestamp: number;
  retryCount: number;
  lastAttempt?: number;
  responseCode?: number;
  response?: string;
  errorMessage?: string;
}

export interface WebhookRetryStats {
  totalEvents: number;
  pendingRetries: number;
  failedEvents: number;
  completedEvents: number;
  averageRetryCount: number;
}

export interface WebhookEventBreakdown {
  eventType: WebhookEventType;
  count: number;
}

export interface WebhookFilters {
  eventTypes: WebhookEventType[];
  statuses: string[];
  dateRange: {
    from?: string;
    to?: string;
  };
  limit: number;
}

export type WebhookEventType = 
  | 'subscription.created'
  | 'payment.successful'
  | 'payment.failed'
  | 'subscription.cancelled'
  | 'subscription.expired';

interface WebhookManagerProps {
  planId: string;
  authClient: AuthClient;
  onClose: () => void;
}

const WEBHOOK_EVENT_TYPES: { value: WebhookEventType; label: string; description: string }[] = [
  {
    value: 'subscription.created',
    label: 'Subscription Created',
    description: 'Triggered when a new subscription is created'
  },
  {
    value: 'payment.successful',
    label: 'Payment Successful',
    description: 'Triggered when a payment is successfully processed'
  },
  {
    value: 'payment.failed',
    label: 'Payment Failed',
    description: 'Triggered when a payment fails'
  },
  {
    value: 'subscription.cancelled',
    label: 'Subscription Cancelled',
    description: 'Triggered when a subscription is cancelled'
  },
  {
    value: 'subscription.expired',
    label: 'Subscription Expired',
    description: 'Triggered when a subscription expires'
  }
];

export function WebhookManager({ planId, authClient, onClose }: WebhookManagerProps): React.ReactElement {
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({
    url: '',
    secret: '',
    events: [],
    isActive: false
  });
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<WebhookEvent[]>([]);
  const [retryStats, setRetryStats] = useState<WebhookRetryStats | null>(null);
  const [eventBreakdown, setEventBreakdown] = useState<WebhookEventBreakdown[]>([]);
  const [filters, setFilters] = useState<WebhookFilters>({
    eventTypes: [],
    statuses: [],
    dateRange: {},
    limit: 50
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'events' | 'stats' | 'docs'>('config');
  const [verificationInfo, setVerificationInfo] = useState<{
    instructions: string;
    exampleSignature: string;
  } | null>(null);

  const { showSuccess, showError, showInfo } = useNotifications();

  // Load existing webhook configuration
  const loadWebhookConfig = useCallback(async () => {
    try {
      setLoading(true);
      const config = await subscriptionService.getWebhookConfig(authClient, planId);
      if (config) {
        setWebhookConfig(config);
      }
    } catch (error) {
      console.error('Failed to load webhook config:', error);
    } finally {
      setLoading(false);
    }
  }, [planId, authClient]);

  // Load webhook events
  const loadWebhookEvents = useCallback(async () => {
    try {
      const events = await subscriptionService.getWebhookEvents(authClient, planId);
      setWebhookEvents(events);
      setFilteredEvents(events); // Initialize filtered events
    } catch (error) {
      console.error('Failed to load webhook events:', error);
    }
  }, [planId, authClient]);

  // Load filtered webhook events
  const loadFilteredWebhookEvents = useCallback(async () => {
    try {
      const filterParams = {
        eventTypes: filters.eventTypes.length > 0 ? filters.eventTypes : [],
        statuses: filters.statuses.length > 0 ? filters.statuses : [],
        fromTime: filters.dateRange.from ? new Date(filters.dateRange.from).getTime() * 1000000 : null,
        toTime: filters.dateRange.to ? new Date(filters.dateRange.to).getTime() * 1000000 : null,
        limit: filters.limit
      };
      
      const events = await subscriptionService.getFilteredWebhookEvents(authClient, planId, filterParams);
      setFilteredEvents(events);
    } catch (error) {
      console.error('Failed to load filtered webhook events:', error);
    }
  }, [planId, authClient, filters]);

  // Load event breakdown for analytics
  const loadEventBreakdown = useCallback(async () => {
    try {
      const breakdown = await subscriptionService.getWebhookEventBreakdown(authClient, planId);
      setEventBreakdown(breakdown);
    } catch (error) {
      console.error('Failed to load event breakdown:', error);
    }
  }, [planId, authClient]);

  // Load retry statistics
  const loadRetryStats = useCallback(async () => {
    try {
      const stats = await subscriptionService.getWebhookRetryStats(authClient, planId);
      setRetryStats(stats);
    } catch (error) {
      console.error('Failed to load retry stats:', error);
    }
  }, [planId, authClient]);

  // Load verification info
  const loadVerificationInfo = useCallback(async () => {
    try {
      const info = await subscriptionService.getWebhookVerificationInfo(authClient, planId);
      if (info) {
        setVerificationInfo(info);
      }
    } catch (error) {
      console.error('Failed to load verification info:', error);
    }
  }, [planId, authClient]);

  useEffect(() => {
    loadWebhookConfig();
    loadWebhookEvents();
    loadRetryStats();
    loadEventBreakdown();
    loadVerificationInfo();
  }, [loadWebhookConfig, loadWebhookEvents, loadRetryStats, loadEventBreakdown, loadVerificationInfo]);

  // Update filtered events when filters change
  useEffect(() => {
    if (filters.eventTypes.length > 0 || filters.statuses.length > 0 || filters.dateRange.from || filters.dateRange.to) {
      loadFilteredWebhookEvents();
    } else {
      setFilteredEvents(webhookEvents);
    }
  }, [filters, loadFilteredWebhookEvents, webhookEvents]);

  // Generate a secure random secret
  const generateSecret = (): void => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setWebhookConfig(prev => ({ ...prev, secret }));
  };

  // Save webhook configuration
  const saveWebhookConfig = async (): Promise<void> => {
    if (!webhookConfig.url.trim()) {
      showError('Validation Error', 'Webhook URL is required');
      return;
    }

    if (!webhookConfig.secret.trim()) {
      showError('Validation Error', 'Webhook secret is required');
      return;
    }

    if (webhookConfig.events.length === 0) {
      showError('Validation Error', 'Please select at least one event type');
      return;
    }

    try {
      setLoading(true);
      
      const config = {
        url: webhookConfig.url,
        secret: webhookConfig.secret,
        events: webhookConfig.events,
        isActive: webhookConfig.isActive,
        maxRetries: 3,
        timeout: 30
      };

      const response = await subscriptionService.configureWebhook(authClient, planId, config);

      if ('ok' in response) {
        showSuccess('Webhook Configured', 'Webhook settings have been saved successfully');
        await loadVerificationInfo();
      } else {
        showError('Configuration Failed', response.err || 'Failed to save webhook configuration');
      }
    } catch (error) {
      showError('Configuration Failed', `Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Test webhook
  const testWebhook = async (): Promise<void> => {
    if (!webhookConfig.url.trim()) {
      showError('Test Failed', 'Please configure webhook URL first');
      return;
    }

    try {
      setTesting(true);
      const response = await subscriptionService.testWebhook(authClient, planId);

      if ('ok' in response) {
        showSuccess('Test Successful', 'Test webhook was sent successfully');
        await loadWebhookEvents(); // Refresh events to show the test
        await loadRetryStats(); // Refresh stats
      } else {
        showError('Test Failed', response.err || 'Failed to send test webhook');
      }
    } catch (error) {
      showError('Test Failed', `Error: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  // Retry specific webhook event
  const retryWebhookEvent = async (eventId: string): Promise<void> => {
    try {
      setRetrying(eventId);
      const response = await subscriptionService.retryWebhookEvent(authClient, parseInt(eventId));

      if ('ok' in response) {
        showSuccess('Retry Initiated', 'Webhook event retry has been initiated');
        await loadWebhookEvents(); // Refresh events
        await loadRetryStats(); // Refresh stats
      } else {
        showError('Retry Failed', response.err || 'Failed to retry webhook event');
      }
    } catch (error) {
      showError('Retry Failed', `Error: ${error}`);
    } finally {
      setRetrying(null);
    }
  };

  // Retry all failed webhooks
  const retryAllFailedWebhooks = async (): Promise<void> => {
    try {
      setLoading(true);
      const retriedCount = await subscriptionService.retryFailedWebhooks(authClient);

      showSuccess('Batch Retry Initiated', `${retriedCount} webhook events have been queued for retry`);
      await loadWebhookEvents(); // Refresh events
      await loadRetryStats(); // Refresh stats
    } catch (error) {
      showError('Batch Retry Failed', `Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle event type selection
  const toggleEventType = (eventType: WebhookEventType): void => {
    setWebhookConfig(prev => ({
      ...prev,
      events: prev.events.includes(eventType)
        ? prev.events.filter(e => e !== eventType)
        : [...prev.events, eventType]
    }));
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp / 1000000).toLocaleString();
  };

  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return '#2ed573';
      case 'failed': return '#ff4757';
      case 'pending': return '#ffa500';
      default: return '#888';
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string): void => {
    navigator.clipboard.writeText(text);
    showInfo('Copied', 'Text copied to clipboard');
  };

  return (
    <div className="webhook-manager">
      <div className="webhook-header">
        <h2>Webhook Configuration</h2>
        <button className="close-btn" onClick={onClose} aria-label="Close webhook manager">
          ×
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="webhook-tabs">
        <button
          className={`tab ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          Configuration
        </button>
        <button
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Event History
        </button>
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Statistics
        </button>
        <button
          className={`tab ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          Documentation
        </button>
      </div>

      {/* Configuration Tab */}
      {activeTab === 'config' && (
        <div className="webhook-config">
          <div className="form-field">
            <label className="form-label required">Webhook URL</label>
            <input
              type="url"
              className="form-input"
              value={webhookConfig.url}
              onChange={(e) => setWebhookConfig(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://your-domain.com/webhooks/bitsub"
              required
            />
            <div className="form-help">
              The URL where webhook events will be sent via HTTP POST
            </div>
          </div>

          <div className="form-field">
            <label className="form-label required">Webhook Secret</label>
            <div className="secret-input-group">
              <input
                type="password"
                className="form-input"
                value={webhookConfig.secret}
                onChange={(e) => setWebhookConfig(prev => ({ ...prev, secret: e.target.value }))}
                placeholder="Enter a secure secret key"
                required
              />
              <Button
                onClick={generateSecret}
                variant="secondary"
                size="sm"
                className="generate-secret-btn"
              >
                Generate
              </Button>
            </div>
            <div className="form-help">
              Used to sign webhook payloads for security verification
            </div>
          </div>

          <div className="form-field">
            <label className="form-label required">Event Types</label>
            <div className="event-types">
              {WEBHOOK_EVENT_TYPES.map((eventType) => (
                <div key={eventType.value} className="event-type-item">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={webhookConfig.events.includes(eventType.value)}
                      onChange={() => toggleEventType(eventType.value)}
                    />
                    <span className="checkbox-custom"></span>
                    <div className="event-info">
                      <div className="event-name">{eventType.label}</div>
                      <div className="event-description">{eventType.description}</div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="form-field">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={webhookConfig.isActive}
                onChange={(e) => setWebhookConfig(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              <span className="checkbox-custom"></span>
              Enable webhook delivery
            </label>
          </div>

          <div className="webhook-actions">
            <Button
              onClick={saveWebhookConfig}
              disabled={loading}
              className="save-btn"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
            <Button
              onClick={testWebhook}
              disabled={testing || !webhookConfig.url}
              variant="secondary"
              className="test-btn"
            >
              {testing ? 'Testing...' : 'Send Test Webhook'}
            </Button>
          </div>
        </div>
      )}

      {/* Event History Tab */}
      {activeTab === 'events' && (
        <div className="webhook-events">
          <div className="events-header">
            <h3>Recent Webhook Events</h3>
            <div className="events-actions">
              <Button 
                onClick={retryAllFailedWebhooks} 
                variant="secondary" 
                size="sm"
                disabled={loading}
              >
                {loading ? 'Retrying...' : 'Retry All Failed'}
              </Button>
              <Button onClick={loadWebhookEvents} variant="secondary" size="sm">
                Refresh
              </Button>
            </div>
          </div>

          {/* Event Filters */}
          <div className="event-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>Event Types:</label>
                <select
                  multiple
                  className="filter-select"
                  value={filters.eventTypes}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value) as WebhookEventType[];
                    setFilters(prev => ({ ...prev, eventTypes: selected }));
                  }}
                >
                  {WEBHOOK_EVENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Status:</label>
                <select
                  multiple
                  className="filter-select"
                  value={filters.statuses}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFilters(prev => ({ ...prev, statuses: selected }));
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="sent">Sent</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Date Range:</label>
                <div className="date-range">
                  <input
                    type="date"
                    className="form-input"
                    value={filters.dateRange.from || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, from: e.target.value }
                    }))}
                    title="From date"
                  />
                  <span className="date-range-label">to</span>
                  <input
                    type="date"
                    className="form-input"
                    value={filters.dateRange.to || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, to: e.target.value }
                    }))}
                    title="To date"
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>Limit:</label>
                <select
                  className="filter-select"
                  value={filters.limit}
                  onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                >
                  <option value={25}>25 events</option>
                  <option value={50}>50 events</option>
                  <option value={100}>100 events</option>
                  <option value={200}>200 events</option>
                </select>
              </div>

              <div className="filter-actions">
                <Button
                  onClick={() => setFilters({
                    eventTypes: [],
                    statuses: [],
                    dateRange: {},
                    limit: 50
                  })}
                  variant="secondary"
                  size="sm"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="empty-state">
              <h4>No webhook events yet</h4>
              <p>Webhook events will appear here once you start receiving subscriptions and payments.</p>
            </div>
          ) : (
            <div className="events-list">
              {filteredEvents.map((event) => (
                <div key={event.id} className="event-item">
                  <div className="event-header">
                    <div className="event-type">{event.eventType}</div>
                    <div 
                      className="event-status"
                      style={{ color: getStatusColor(event.status) }}
                    >
                      {event.status}
                    </div>
                  </div>
                  
                  <div className="event-details">
                    <div className="event-meta">
                      <span>Subscription ID: {event.subscriptionId}</span>
                      <span>Retry Count: {event.retryCount}</span>
                      <span>{formatTimestamp(event.timestamp)}</span>
                      {event.lastAttempt && (
                        <span>Last Attempt: {formatTimestamp(event.lastAttempt)}</span>
                      )}
                    </div>
                    
                    {event.responseCode && (
                      <div className="event-response">
                        <strong>Response Code:</strong> {event.responseCode}
                      </div>
                    )}
                    
                    {event.response && (
                      <div className="event-response">
                        <strong>Response:</strong> {event.response}
                      </div>
                    )}
                    
                    {event.errorMessage && (
                      <div className="event-error">
                        <strong>Error:</strong> {event.errorMessage}
                      </div>
                    )}

                    {(event.status === 'failed' || event.status === 'pending') && event.retryCount < 5 && (
                      <div className="event-actions">
                        <Button
                          onClick={() => retryWebhookEvent(event.id)}
                          disabled={retrying === event.id}
                          variant="secondary"
                          size="sm"
                        >
                          {retrying === event.id ? 'Retrying...' : 'Retry Now'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && (
        <div className="webhook-stats">
          <h3>Webhook Statistics</h3>
          
          {retryStats ? (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{retryStats.totalEvents}</div>
                  <div className="stat-label">Total Events</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{retryStats.completedEvents}</div>
                  <div className="stat-label">Successful</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{retryStats.pendingRetries}</div>
                  <div className="stat-label">Pending Retries</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{retryStats.failedEvents}</div>
                  <div className="stat-label">Failed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{retryStats.averageRetryCount}</div>
                  <div className="stat-label">Avg Retry Count</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">
                    {retryStats.totalEvents > 0 
                      ? Math.round((retryStats.completedEvents / retryStats.totalEvents) * 100) 
                      : 0}%
                  </div>
                  <div className="stat-label">Success Rate</div>
                </div>
              </div>

              {/* Event Type Breakdown */}
              <div className="stats-section">
                <h4>Event Type Breakdown</h4>
                <div className="event-breakdown">
                  {eventBreakdown.map((item) => (
                    <div key={item.eventType} className="breakdown-item">
                      <div className="breakdown-label">
                        {WEBHOOK_EVENT_TYPES.find(t => t.value === item.eventType)?.label || item.eventType}
                      </div>
                      <div className="breakdown-bar">
                        <div 
                          className="breakdown-fill"
                          style={{ 
                            width: `${retryStats.totalEvents > 0 ? (item.count / retryStats.totalEvents) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <div className="breakdown-count">{item.count}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="stats-details">
                <div className="stats-section">
                  <h4>Retry Policy</h4>
                  <div className="retry-policy">
                    <div className="policy-item">
                      <strong>Attempt 1:</strong> Immediate retry after 1 minute
                    </div>
                    <div className="policy-item">
                      <strong>Attempt 2:</strong> Retry after 5 minutes (exponential backoff)
                    </div>
                    <div className="policy-item">
                      <strong>Attempt 3:</strong> Final retry after 15 minutes
                    </div>
                    <div className="policy-item">
                      <strong>Max Attempts:</strong> 3 automatic retries, then manual retry available
                    </div>
                  </div>
                </div>

                <div className="stats-section">
                  <h4>Health Check</h4>
                  <div className="health-indicators">
                    <div className={`health-item ${retryStats.failedEvents === 0 ? 'healthy' : 'warning'}`}>
                      <span className="health-icon">
                        {retryStats.failedEvents === 0 ? '✅' : '⚠️'}
                      </span>
                      <span className="health-text">
                        {retryStats.failedEvents === 0 
                          ? 'All webhooks are delivering successfully' 
                          : `${retryStats.failedEvents} webhook(s) failed permanently`}
                      </span>
                    </div>
                    
                    <div className={`health-item ${retryStats.pendingRetries === 0 ? 'healthy' : 'info'}`}>
                      <span className="health-icon">
                        {retryStats.pendingRetries === 0 ? '✅' : 'ℹ️'}
                      </span>
                      <span className="health-text">
                        {retryStats.pendingRetries === 0 
                          ? 'No pending retries' 
                          : `${retryStats.pendingRetries} webhook(s) pending retry`}
                      </span>
                    </div>

                    <div className={`health-item ${retryStats.averageRetryCount <= 1 ? 'healthy' : 'warning'}`}>
                      <span className="health-icon">
                        {retryStats.averageRetryCount <= 1 ? '✅' : '⚠️'}
                      </span>
                      <span className="health-text">
                        {retryStats.averageRetryCount <= 1 
                          ? 'Low retry rate indicates good webhook reliability' 
                          : 'High retry rate suggests webhook endpoint issues'}
                      </span>
                    </div>
                  </div>
                </div>

                {(retryStats.failedEvents > 0 || retryStats.pendingRetries > 0) && (
                  <div className="stats-actions">
                    <Button
                      onClick={retryAllFailedWebhooks}
                      disabled={loading}
                      variant="primary"
                    >
                      {loading ? 'Processing...' : 'Retry All Failed Webhooks'}
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="loading-state">
              <p>Loading webhook statistics...</p>
            </div>
          )}
        </div>
      )}

      {/* Documentation Tab */}
      {activeTab === 'docs' && (
        <div className="webhook-docs">
          <h3>Webhook Documentation</h3>
          
          <div className="docs-section">
            <h4>Overview</h4>
            <p>
              Webhooks allow your application to receive real-time notifications when events occur 
              in your BitSub subscriptions. When an event happens, we'll send a HTTP POST request 
              to your configured endpoint.
            </p>
          </div>

          <div className="docs-section">
            <h4>Security</h4>
            <p>
              All webhook payloads are signed with your webhook secret using HMAC-SHA256. 
              You should verify the signature to ensure the request came from BitSub.
            </p>
            
            {verificationInfo && (
              <div className="code-example">
                <div className="code-header">
                  <span>Signature Verification Example</span>
                  <Button 
                    onClick={() => copyToClipboard(verificationInfo.instructions)}
                    variant="secondary" 
                    size="sm"
                  >
                    Copy
                  </Button>
                </div>
                <pre className="code-block">
                  <code>{verificationInfo.instructions}</code>
                </pre>
              </div>
            )}
          </div>

          <div className="docs-section">
            <h4>Payload Format</h4>
            <div className="code-example">
              <div className="code-header">
                <span>Example Webhook Payload</span>
                <Button 
                  onClick={() => copyToClipboard(`{
  "event": "subscription.created",
  "subscriptionId": 123,
  "subscriber": "rdmx6-jaaaa-aaaah-qcaiq-cai",
  "subscriberAccount": "bc1q...",
  "plan": {
    "planId": "plan_123",
    "title": "Premium Plan",
    "amount": 10000
  },
  "payment": {
    "amount": 10000,
    "status": "confirmed",
    "timestamp": 1640995200000000000,
    "nextPayment": 1643673600000000000
  },
  "signature": "sha256=abc123...",
  "timestamp": 1640995200000000000
}`)}
                  variant="secondary" 
                  size="sm"
                >
                  Copy
                </Button>
              </div>
              <pre className="code-block">
                <code>{`{
  "event": "subscription.created",
  "subscriptionId": 123,
  "subscriber": "rdmx6-jaaaa-aaaah-qcaiq-cai",
  "subscriberAccount": "bc1q...",
  "plan": {
    "planId": "plan_123",
    "title": "Premium Plan",
    "amount": 10000
  },
  "payment": {
    "amount": 10000,
    "status": "confirmed",
    "timestamp": 1640995200000000000,
    "nextPayment": 1643673600000000000
  },
  "signature": "sha256=abc123...",
  "timestamp": 1640995200000000000
}`}</code>
              </pre>
            </div>
          </div>

          <div className="docs-section">
            <h4>Event Types</h4>
            <div className="event-types-docs">
              {WEBHOOK_EVENT_TYPES.map((eventType) => (
                <div key={eventType.value} className="event-type-doc">
                  <strong>{eventType.value}</strong>
                  <p>{eventType.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="docs-section">
            <h4>Best Practices</h4>
            <ul>
              <li>Always verify the webhook signature to ensure authenticity</li>
              <li>Respond with a 2xx status code to acknowledge receipt</li>
              <li>Implement idempotency to handle duplicate events gracefully</li>
              <li>Use HTTPS endpoints for security</li>
              <li>Handle webhook timeouts and retries appropriately</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}