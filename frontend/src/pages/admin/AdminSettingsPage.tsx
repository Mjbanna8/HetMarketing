import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { Spinner } from '../../components/Shared';
import toast from 'react-hot-toast';

export default function AdminSettingsPage(): React.ReactElement {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then(({ data }) => {
      if (data.data) setSettings(data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({ key, value }));
      const { data } = await adminApi.updateSettings(updates);
      if (data.data) setSettings(data.data);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save settings'); }
    setSaving(false);
  };

  const updateField = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // Template preview
  const previewMessage = (settings.wp_message_template ?? '')
    .replace(/\{\{storeName\}\}/g, settings.store_name ?? 'Store')
    .replace(/\{\{productName\}\}/g, 'Sample Product')
    .replace(/\{\{qty\}\}/g, '2')
    .replace(/\{\{unitPrice\}\}/g, '999')
    .replace(/\{\{totalPrice\}\}/g, '1,998')
    .replace(/\{\{fullName\}\}/g, 'John Doe')
    .replace(/\{\{mobile\}\}/g, '+919999999999')
    .replace(/\{\{deliveryAddress\}\}/g, '123 Main Street, City')
    .replace(/\{\{note\}\}/g, 'None')
    .replace(/\{\{time\}\}/g, '24/03/2026 12:00')
    .replace(/\{\{orderId\}\}/g, 'clx1234abc');

  if (loading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-surface-900 mb-8">Settings</h1>
      <div className="max-w-2xl space-y-6">
        {/* Store Settings */}
        <div className="card p-6 space-y-5">
          <h3 className="font-semibold text-surface-900">Store Information</h3>
          <div>
            <label htmlFor="store-name" className="block text-sm font-medium text-surface-700 mb-2">Store Name</label>
            <input id="store-name" type="text" className="input-field" value={settings.store_name ?? ''} onChange={(e) => updateField('store_name', e.target.value)} />
          </div>
          <div>
            <label htmlFor="store-logo" className="block text-sm font-medium text-surface-700 mb-2">Store Logo URL</label>
            <input id="store-logo" type="text" className="input-field" value={settings.store_logo_url ?? ''} onChange={(e) => updateField('store_logo_url', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-surface-700 mb-2">Contact Email</label>
            <input id="contact-email" type="email" className="input-field" value={settings.contact_email ?? ''} onChange={(e) => updateField('contact_email', e.target.value)} />
          </div>
        </div>

        {/* WhatsApp Settings */}
        <div className="card p-6 space-y-5">
          <h3 className="font-semibold text-surface-900">WhatsApp Configuration</h3>
          <div>
            <label htmlFor="wa-number" className="block text-sm font-medium text-surface-700 mb-2">WhatsApp Number (with country code)</label>
            <input id="wa-number" type="text" className="input-field" value={settings.whatsapp_number ?? ''} onChange={(e) => updateField('whatsapp_number', e.target.value)} placeholder="+919999999999" />
            <p className="text-xs text-surface-400 mt-1">Changes take effect immediately for new orders</p>
          </div>
          <div>
            <label htmlFor="wa-template" className="block text-sm font-medium text-surface-700 mb-2">Message Template</label>
            <textarea
              id="wa-template"
              className="input-field min-h-[200px] resize-y font-mono text-sm"
              value={settings.wp_message_template ?? ''}
              onChange={(e) => updateField('wp_message_template', e.target.value)}
              placeholder="Use {{placeholders}} for dynamic values"
            />
            <p className="text-xs text-surface-400 mt-1">
              Available placeholders: {'{{storeName}}'}, {'{{productName}}'}, {'{{qty}}'}, {'{{unitPrice}}'}, {'{{totalPrice}}'}, {'{{fullName}}'}, {'{{mobile}}'}, {'{{deliveryAddress}}'}, {'{{note}}'}, {'{{time}}'}, {'{{orderId}}'}
            </p>
          </div>

          {/* Preview */}
          <div>
            <h4 className="text-sm font-medium text-surface-700 mb-2">Preview</h4>
            <div className="bg-green-50 rounded-xl p-4 text-sm whitespace-pre-wrap font-mono border border-green-200">
              {previewMessage}
            </div>
          </div>
        </div>

        <button onClick={handleSave} className="btn-primary" disabled={saving}>
          {saving ? <Spinner size="sm" /> : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
