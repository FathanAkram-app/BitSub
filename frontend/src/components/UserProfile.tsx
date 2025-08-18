import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { Button, Card, Loading } from './ui';
import { Modal } from './ui/Modal';
import { FormField } from './ui/Form';
import { toast } from './ui/Toast';
import { subscriptionService } from '../services/subscriptionService';

interface UserProfileProps {
  authClient: AuthClient;
}

interface UserPreferences {
  emailNotifications: boolean;
  webhookNotifications: boolean;
  marketingEmails: boolean;
  defaultCurrency: 'sats' | 'usd';
  timeZone: string;
  language: string;
}

interface UserStats {
  totalEarned: number;
  totalSpent: number;
  activeSubscriptions: number;
  createdPlans: number;
  joinDate: number;
}

export function UserProfile({ authClient }: UserProfileProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    webhookNotifications: true,
    marketingEmails: false,
    defaultCurrency: 'sats',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: 'en'
  });
  const [stats, setStats] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'stats'>('profile');

  useEffect(() => {
    if (isOpen) {
      loadUserData();
    }
  }, [isOpen]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load user preferences from localStorage for now
      const savedPrefs = localStorage.getItem('userPreferences');
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }

      // Load user stats
      const userStats = await subscriptionService.getUserStats(authClient);
      setStats(userStats);
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      // Save to localStorage for now (would be backend in production)
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      toast.success('Preferences saved successfully!');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const getUserPrincipal = () => {
    return authClient.getIdentity().getPrincipal().toString();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const renderProfileTabRedesign = () => (
    <div className="profile-content-section">
      <div className="info-grid">
        <div className="info-card">
          <div className="info-header">
            <span className="info-icon">🆔</span>
            <h3>Account Information</h3>
          </div>
          <div className="info-items">
            <div className="info-item">
              <label>Principal ID</label>
              <div className="principal-display">
                <code>{getUserPrincipal()}</code>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(getUserPrincipal());
                    toast.success('Principal ID copied!');
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div className="info-item">
              <label>Account Type</label>
              <span className="account-type-badge">Internet Identity</span>
            </div>
            {stats && (
              <div className="info-item">
                <label>Member Since</label>
                <span>{formatDate(stats.joinDate)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="info-card">
          <div className="info-header">
            <span className="info-icon">🔐</span>
            <h3>Security & Access</h3>
          </div>
          <div className="info-items">
            <div className="action-item">
              <span>Export Account Data</span>
              <Button variant="secondary" size="sm">Export</Button>
            </div>
            <div className="action-item">
              <span>Refresh Identity</span>
              <Button variant="secondary" size="sm">Refresh</Button>
            </div>
            <div className="action-item danger">
              <span>Sign Out</span>
              <Button variant="danger" size="sm">Sign Out</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="profile-tab-content">
      <div className="profile-section">
        <h3>Account Information</h3>
        <div className="profile-fields">
          <div className="profile-field">
            <label className="field-label">
              Principal ID
            </label>
            <div className="principal-id-row">
              <code className="principal-code">
                {getUserPrincipal()}
              </code>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  navigator.clipboard.writeText(getUserPrincipal());
                  toast.success('Principal ID copied to clipboard!');
                }}
              >
                📋 Copy
              </Button>
            </div>
          </div>

          <div className="profile-field">
            <label className="field-label">
              Account Type
            </label>
            <div className="badge badge-primary">
              Internet Identity User
            </div>
          </div>

          {stats && (
            <div className="profile-field">
              <label className="field-label">
                Member Since
              </label>
              <p className="field-value">{formatDate(stats.joinDate)}</p>
            </div>
          )}
        </div>
      </div>

      <div className="profile-actions">
        <h3>Account Actions</h3>
        <div className="action-buttons">
          <Button variant="secondary" className="action-btn">
            📤 Export Account Data
          </Button>
          <Button variant="secondary" className="action-btn">
            🔄 Refresh Identity
          </Button>
          <Button variant="danger" className="action-btn">
            🚪 Sign Out
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPreferencesTabRedesign = () => (
    <div className="profile-content-section">
      <div className="settings-grid">
        <div className="settings-card">
          <div className="settings-header">
            <span className="settings-icon">🔔</span>
            <h3>Notifications</h3>
            <p>Control how you receive updates</p>
          </div>
          <div className="settings-options">
            <div className="setting-toggle">
              <div className="setting-info">
                <span className="setting-label">Email Notifications</span>
                <span className="setting-desc">Payment confirmations and updates</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    emailNotifications: e.target.checked
                  }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-toggle">
              <div className="setting-info">
                <span className="setting-label">Webhooks</span>
                <span className="setting-desc">Real-time API notifications</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.webhookNotifications}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    webhookNotifications: e.target.checked
                  }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-toggle">
              <div className="setting-info">
                <span className="setting-label">Marketing</span>
                <span className="setting-desc">Feature updates and news</span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={preferences.marketingEmails}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    marketingEmails: e.target.checked
                  }))}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-header">
            <span className="settings-icon">⚙️</span>
            <h3>Display Preferences</h3>
            <p>Customize your experience</p>
          </div>
          <div className="settings-fields">
            <div className="setting-field">
              <label>Default Currency</label>
              <select
                value={preferences.defaultCurrency}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  defaultCurrency: e.target.value as 'sats' | 'usd'
                }))}
                className="setting-select"
              >
                <option value="sats">Satoshis (sats)</option>
                <option value="usd">US Dollars (USD)</option>
              </select>
            </div>

            <div className="setting-field">
              <label>Time Zone</label>
              <select
                value={preferences.timeZone}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  timeZone: e.target.value
                }))}
                className="setting-select"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
                <option value="Asia/Shanghai">Shanghai</option>
              </select>
            </div>
          </div>

          <div className="settings-actions">
            <Button onClick={savePreferences} variant="primary">
              Save Preferences
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreferencesTab = () => (
    <div className="preferences-tab-content">
      <div className="preferences-section">
        <h3>Notifications</h3>
        <div className="preference-options">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={preferences.emailNotifications}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                emailNotifications: e.target.checked
              }))}
            />
            <div className="checkbox-content">
              <div className="checkbox-title">Email Notifications</div>
              <div className="checkbox-description">
                Receive emails for payment confirmations and subscription updates
              </div>
            </div>
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={preferences.webhookNotifications}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                webhookNotifications: e.target.checked
              }))}
            />
            <div className="checkbox-content">
              <div className="checkbox-title">Webhook Notifications</div>
              <div className="checkbox-description">
                Send real-time notifications to your configured webhooks
              </div>
            </div>
          </label>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={preferences.marketingEmails}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                marketingEmails: e.target.checked
              }))}
            />
            <div className="checkbox-content">
              <div className="checkbox-title">Marketing Communications</div>
              <div className="checkbox-description">
                Receive updates about new features and platform improvements
              </div>
            </div>
          </label>
        </div>
      </div>

      <div className="preferences-section">
        <h3>Display Preferences</h3>
        <div className="preference-fields">
          <FormField
            label="Default Currency Display"
            value={preferences.defaultCurrency}
            onChange={(value) => setPreferences(prev => ({
              ...prev,
              defaultCurrency: value as 'sats' | 'usd'
            }))}
            type="select"
            options={[
              { value: 'sats', label: 'Satoshis (sats)' },
              { value: 'usd', label: 'US Dollars (USD)' }
            ]}
          />

          <FormField
            label="Time Zone"
            value={preferences.timeZone}
            onChange={(value) => setPreferences(prev => ({
              ...prev,
              timeZone: value
            }))}
            type="select"
            options={[
              { value: 'UTC', label: 'UTC' },
              { value: 'America/New_York', label: 'Eastern Time' },
              { value: 'America/Chicago', label: 'Central Time' },
              { value: 'America/Denver', label: 'Mountain Time' },
              { value: 'America/Los_Angeles', label: 'Pacific Time' },
              { value: 'Europe/London', label: 'London' },
              { value: 'Europe/Paris', label: 'Paris' },
              { value: 'Asia/Tokyo', label: 'Tokyo' },
              { value: 'Asia/Shanghai', label: 'Shanghai' }
            ]}
          />
        </div>
      </div>

      <div className="preferences-actions">
        <Button onClick={savePreferences} variant="primary">
          💾 Save Preferences
        </Button>
      </div>
    </div>
  );

  const renderStatsTabRedesign = () => (
    <div className="profile-content-section">
      {stats ? (
        <>
          <div className="stats-overview">
            <div className="stats-card-redesign">
              <div className="stat-icon earned">💰</div>
              <div className="stat-details">
                <span className="stat-value">{stats.totalEarned.toLocaleString()}</span>
                <span className="stat-unit">sats earned</span>
              </div>
            </div>

            <div className="stats-card-redesign">
              <div className="stat-icon spent">💸</div>
              <div className="stat-details">
                <span className="stat-value">{stats.totalSpent.toLocaleString()}</span>
                <span className="stat-unit">sats spent</span>
              </div>
            </div>

            <div className="stats-card-redesign">
              <div className="stat-icon subscriptions">🎯</div>
              <div className="stat-details">
                <span className="stat-value">{stats.activeSubscriptions}</span>
                <span className="stat-unit">active subscriptions</span>
              </div>
            </div>

            <div className="stats-card-redesign">
              <div className="stat-icon plans">📋</div>
              <div className="stat-details">
                <span className="stat-value">{stats.createdPlans}</span>
                <span className="stat-unit">plans created</span>
              </div>
            </div>
          </div>

          <div className="activity-timeline">
            <div className="timeline-header">
              <span className="timeline-icon">📈</span>
              <h3>Account Activity</h3>
            </div>
            <div className="timeline-items">
              <div className="timeline-item">
                <div className="timeline-marker success"></div>
                <div className="timeline-content">
                  <span className="timeline-title">Account Created</span>
                  <span className="timeline-date">{formatDate(stats.joinDate)}</span>
                </div>
              </div>
              
              {stats.createdPlans > 0 && (
                <div className="timeline-item">
                  <div className="timeline-marker primary"></div>
                  <div className="timeline-content">
                    <span className="timeline-title">First Plan Created</span>
                    <span className="timeline-desc">Started offering subscription services</span>
                  </div>
                </div>
              )}

              {stats.activeSubscriptions > 0 && (
                <div className="timeline-item">
                  <div className="timeline-marker accent"></div>
                  <div className="timeline-content">
                    <span className="timeline-title">Active Subscriber</span>
                    <span className="timeline-desc">Subscribed to {stats.activeSubscriptions} plan(s)</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="stats-loading">
          <Loading text="Loading statistics..." />
        </div>
      )}
    </div>
  );

  const renderStatsTab = () => (
    <div className="stats-tab-content">
      {stats ? (
        <>
          <div className="stats-grid">
            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-value earned">
                  {stats.totalEarned.toLocaleString()} sats
                </div>
                <div className="stat-label">Total Earned</div>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-value spent">
                  {stats.totalSpent.toLocaleString()} sats
                </div>
                <div className="stat-label">Total Spent</div>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-value subscriptions">
                  {stats.activeSubscriptions}
                </div>
                <div className="stat-label">Active Subscriptions</div>
              </div>
            </Card>

            <Card className="stat-card">
              <div className="stat-content">
                <div className="stat-value plans">
                  {stats.createdPlans}
                </div>
                <div className="stat-label">Plans Created</div>
              </div>
            </Card>
          </div>

          <div className="account-activity">
            <h3>Account Activity</h3>
            <div className="activity-list">
              <div className="activity-item">
                <span className="activity-icon success">✅</span>
                <div className="activity-content">
                  <div className="activity-title">Account created</div>
                  <div className="activity-date">{formatDate(stats.joinDate)}</div>
                </div>
              </div>
              
              {stats.createdPlans > 0 && (
                <div className="activity-item">
                  <span className="activity-icon primary">📋</span>
                  <div className="activity-content">
                    <div className="activity-title">First plan created</div>
                    <div className="activity-description">Started creating subscription plans</div>
                  </div>
                </div>
              )}

              {stats.activeSubscriptions > 0 && (
                <div className="activity-item">
                  <span className="activity-icon accent">🎯</span>
                  <div className="activity-content">
                    <div className="activity-title">Active subscriber</div>
                    <div className="activity-description">Currently subscribed to {stats.activeSubscriptions} plan(s)</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="stats-loading">
          <Loading text="Loading account statistics..." />
        </div>
      )}
    </div>
  );

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="secondary"
        size="sm"
        className="profile-trigger"
      >
        👤 Profile
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="User Profile"
        size="lg"
      >
        <div className="profile-modal-redesign">
          {loading ? (
            <div className="loading-container">
              <Loading text="Loading profile..." />
            </div>
          ) : (
            <>
              {/* Clean Header */}
              <div className="profile-header-redesign">
                <div className="profile-identity">
                  <div className="profile-avatar-redesign">
                    {getUserPrincipal().substring(0, 2).toUpperCase()}
                  </div>
                  <div className="profile-details">
                    <h2>BitSub Account</h2>
                    <p>Internet Identity User</p>
                    <div className="principal-badge">
                      <span>ID: {getUserPrincipal().substring(0, 6)}...</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(getUserPrincipal());
                          toast.success('Principal ID copied!');
                        }}
                        className="copy-btn-small"
                        title="Copy full Principal ID"
                      >
                        📋
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean Navigation */}
              <div className="profile-nav-redesign">
                <button
                  className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  <span className="nav-icon">👤</span>
                  <span>Profile</span>
                </button>
                <button
                  className={`nav-btn ${activeTab === 'preferences' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preferences')}
                >
                  <span className="nav-icon">⚙️</span>
                  <span>Settings</span>
                </button>
                <button
                  className={`nav-btn ${activeTab === 'stats' ? 'active' : ''}`}
                  onClick={() => setActiveTab('stats')}
                >
                  <span className="nav-icon">📊</span>
                  <span>Statistics</span>
                </button>
              </div>

              {/* Clean Content */}
              <div className="profile-content-redesign">
                {activeTab === 'profile' && renderProfileTabRedesign()}
                {activeTab === 'preferences' && renderPreferencesTabRedesign()}
                {activeTab === 'stats' && renderStatsTabRedesign()}
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}