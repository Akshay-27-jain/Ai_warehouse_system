import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock3,
  Mail,
  Save,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import Card from '../components/ui/Card';
import { notificationApi } from '../lib/api';

const defaultPreferences = {
  low_stock: true,
  out_of_stock: true,
  transfers: true,
  reports: true,
  orders: true,
  ai_insights: true,
  system_alerts: true,
};

const preferenceOptions = [
  {
    key: 'low_stock',
    label: 'Low stock email alerts',
    description: 'Send when stock reaches the minimum level.',
  },
  {
    key: 'out_of_stock',
    label: 'Out of stock alerts',
    description: 'Notify when inventory is depleted.',
  },
  {
    key: 'transfers',
    label: 'Warehouse transfer alerts',
    description: 'Send updates for stock transfers between locations.',
  },
  {
    key: 'reports',
    label: 'Scheduled report emails',
    description: 'Receive operational summary emails.',
  },
  {
    key: 'orders',
    label: 'Order updates',
    description: 'Send updates for fulfillment and order changes.',
  },
  {
    key: 'ai_insights',
    label: 'AI insights',
    description: 'Deliver forecast and anomaly recommendations.',
  },
  {
    key: 'system_alerts',
    label: 'System alerts',
    description: 'Notify for critical platform or workflow issues.',
  },
];

export default function SettingsPage() {
  const [email, setEmail] = useState(() => {
    try {
      const raw = localStorage.getItem('current_user');
      if (raw) return JSON.parse(raw).email || '';
    } catch (e) {}
    return '';
  });
  const [forecastHorizon, setForecastHorizon] = useState('14 days');
  const [notificationChannel, setNotificationChannel] = useState('Email + Slack');
  const [preferences, setPreferences] = useState<Record<string, boolean>>(defaultPreferences);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'info' | 'success' | 'warning'>('info');
  const [sending, setSending] = useState(false);

  const enabledAlertCount = Object.values(preferences).filter(Boolean).length;

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await notificationApi.getPreferences() as { data?: Record<string, boolean> };
        const loadedPreferences = response?.data || {};
        setPreferences({ ...defaultPreferences, ...loadedPreferences });
      } catch (error) {
        console.warn('Unable to load notification preferences', error);
      }
    };

    void loadPreferences();
  }, []);

  const savePreferences = async () => {
    try {
      await notificationApi.savePreferences(preferences);
      setStatus('Notification preferences saved.');
      setStatusType('success');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not save preferences.');
      setStatusType('warning');
    }
  };

  const testEmail = async () => {
    setSending(true);
    setStatus('');
    setStatusType('info');

    try {
      await notificationApi.testEmail({ email, preferences });
      setStatus('Test email sent successfully.');
      setStatusType('success');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not send test email.');
      setStatusType('warning');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-hero">
        <div>
          <p className="eyebrow">Application settings</p>
          <h1 className="page-title">Operational preferences</h1>
          <p className="page-subtitle">
            Configure forecasts, integrations, and inbox alerts across your warehouse network.
          </p>
        </div>
        <button className="btn-primary" type="button" onClick={savePreferences}>
          <Save size={18} />
          Save Settings
        </button>
      </div>

      <div className="settings-summary-grid">
        <div className="settings-summary-item">
          <ShieldCheck size={22} />
          <div>
            <strong>Secure workspace</strong>
            <span>Role-aware API access</span>
          </div>
        </div>
        <div className="settings-summary-item">
          <Clock3 size={22} />
          <div>
            <strong>{forecastHorizon}</strong>
            <span>Forecast planning window</span>
          </div>
        </div>
        <div className="settings-summary-item">
          <BellRing size={22} />
          <div>
            <strong>{enabledAlertCount} alerts on</strong>
            <span>Email notification preferences</span>
          </div>
        </div>
      </div>

      <div className="settings-grid">
        <Card
          title="System Settings"
          subtitle="Forecast defaults and integration preferences"
          icon={<SlidersHorizontal size={22} />}
        >
          <div className="form-grid form-grid-2">
            <label className="form-section">
              <span className="form-label">Forecast Horizon</span>
              <select
                className="form-input"
                value={forecastHorizon}
                onChange={(event) => setForecastHorizon(event.target.value)}
              >
                <option>7 days</option>
                <option>14 days</option>
                <option>30 days</option>
                <option>60 days</option>
              </select>
            </label>

            <label className="form-section">
              <span className="form-label">Notification Channel</span>
              <select
                className="form-input"
                value={notificationChannel}
                onChange={(event) => setNotificationChannel(event.target.value)}
              >
                <option>Email</option>
                <option>Email + Slack</option>
                <option>Email + Dashboard</option>
              </select>
            </label>
          </div>

          <div className="integration-panel">
            <div className="integration-icon">
              <Sparkles size={22} />
            </div>
            <div>
              <strong>Integration status</strong>
              <p>Dashboard alerts are ready. Email alerts activate after email settings are configured in <code>.env</code>.</p>
            </div>
          </div>

          <button className="glow-btn settings-save" type="button" onClick={savePreferences}>
            <Save size={18} />
            Save System Preferences
          </button>
        </Card>

        <Card
          title="Email Notifications"
          subtitle="Choose which operational alerts should be sent to your inbox"
          icon={<Mail size={22} />}
        >
          <div className="notification-settings">
            <label className="form-section">
              <span className="form-label">Notification email</span>
              <input
                className="form-input"
                value={email}
                placeholder="you@example.com"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <div className="preference-list">
              {preferenceOptions.map((option) => (
                <label className="preference-row" key={option.key}>
                  <span className="preference-copy">
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </span>
                  <input
                    className="toggle-input"
                    type="checkbox"
                    checked={preferences[option.key]}
                    onChange={(event) => setPreferences({
                      ...preferences,
                      [option.key]: event.target.checked,
                    })}
                  />
                </label>
              ))}
            </div>

            <div className="settings-actions">
              <button className="glow-btn" type="button" onClick={testEmail} disabled={sending}>
                <Send size={18} />
                {sending ? 'Sending...' : 'Send Test Email'}
              </button>
              <span className={`settings-status ${statusType}`}>
                {statusType === 'success' ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
                {status || 'Email delivery requires SMTP or Gmail OAuth settings in .env.'}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
