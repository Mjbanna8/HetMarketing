import React, { useEffect, useState, useRef } from 'react';
import { adminApi } from '../../api';
import { Spinner } from '../../components/Shared';
import toast from 'react-hot-toast';

// All About Us text keys stored in SiteSetting
const ABOUT_KEYS = [
  'about_hero_headline',
  'about_hero_tagline',
  'about_why_title',
  'about_feature1_title',
  'about_feature1_desc',
  'about_feature2_title',
  'about_feature2_desc',
  'about_feature3_title',
  'about_feature3_desc',
  'about_founder_label',
  'about_founder_quote',
  'about_founder_bio1',
  'about_founder_bio2',
  'about_founder_name',
  'about_founder_image',
  'about_team_title',
  'about_team_subtitle',
  'about_member1_name',
  'about_member1_role',
  'about_member1_bio',
  'about_member1_image',
  'about_member2_name',
  'about_member2_role',
  'about_member2_bio',
  'about_member2_image',
  'about_cta_headline',
  'about_cta_subtext',
];

const DEFAULT_VALUES: Record<string, string> = {
  about_hero_headline: "Shopping Simplified, Delivered via WhatsApp",
  about_hero_tagline: "Experience the future of conversational commerce. We bridge the gap between premium curation and the ease of a simple text message.",
  about_why_title: "Why Choose HetMarketing?",
  about_feature1_title: "Curated Quality",
  about_feature1_desc: "Every merchant and product on our platform undergoes a rigorous vetting process to ensure editorial excellence.",
  about_feature2_title: "Instant WhatsApp Ordering",
  about_feature2_desc: "No complicated checkouts. Tap, chat, and confirm your order in seconds directly through your favorite messaging app.",
  about_feature3_title: "Unbeatable Discounts",
  about_feature3_desc: "By cutting out the middleman and traditional storefront costs, we pass the editorial savings directly to you.",
  about_founder_label: "Founder's Note",
  about_founder_quote: '"We\'re returning the \'Human\' to Digital Commerce."',
  about_founder_bio1: "My name is Mouryrajsinh Jadeja, and I started HetMarketing with a simple observation: modern e-commerce has become too cold, too mechanical. We missed the feeling of talking to a merchant who understands our needs.",
  about_founder_bio2: "HetMarketing isn't just a platform; it's a bridge. By leveraging WhatsApp, we create a shopping experience that feels like a conversation with a trusted friend. Our mission is to curate the finest products and deliver them with the immediacy that the modern world demands.",
  about_founder_name: "Mouryrajsinh, Founder of HetMarketing",
  about_founder_image: "",
  about_team_title: "The Precision Curators",
  about_team_subtitle: "The minds behind the invisible concierge experience.",
  about_member1_name: "Privet",
  about_member1_role: "Head of Curation",
  about_member1_bio: "leads our vetting team, ensuring every brand that joins HetMarketing meets our high-gloss editorial standards.",
  about_member1_image: "",
  about_member2_name: "Privet",
  about_member2_role: "Chief Integrationist",
  about_member2_bio: "oversees our API architecture, making the WhatsApp commerce experience seamless and lightning-fast.",
  about_member2_image: "",
  about_cta_headline: "Ready to Shop Differently?",
  about_cta_subtext: "Join thousands of shoppers who have traded complicated apps for simple conversations.",
};

type FieldConfig = {
  key: string;
  label: string;
  multiline?: boolean;
  section: string;
};

const FIELDS: FieldConfig[] = [
  // Hero
  { section: 'Hero Section', key: 'about_hero_headline', label: 'Headline' },
  { section: 'Hero Section', key: 'about_hero_tagline', label: 'Tagline / Subtext', multiline: true },

  // Why Choose Us
  { section: 'Why Choose Us', key: 'about_why_title', label: 'Section Title' },
  { section: 'Why Choose Us', key: 'about_feature1_title', label: 'Feature 1 – Title' },
  { section: 'Why Choose Us', key: 'about_feature1_desc', label: 'Feature 1 – Description', multiline: true },
  { section: 'Why Choose Us', key: 'about_feature2_title', label: 'Feature 2 – Title' },
  { section: 'Why Choose Us', key: 'about_feature2_desc', label: 'Feature 2 – Description', multiline: true },
  { section: 'Why Choose Us', key: 'about_feature3_title', label: 'Feature 3 – Title' },
  { section: 'Why Choose Us', key: 'about_feature3_desc', label: 'Feature 3 – Description', multiline: true },

  // Founder's Note
  { section: "Founder's Note", key: 'about_founder_label', label: 'Section Label (small caps text)' },
  { section: "Founder's Note", key: 'about_founder_quote', label: 'Pull Quote', multiline: true },
  { section: "Founder's Note", key: 'about_founder_bio1', label: 'Biography – Paragraph 1', multiline: true },
  { section: "Founder's Note", key: 'about_founder_bio2', label: 'Biography – Paragraph 2', multiline: true },
  { section: "Founder's Note", key: 'about_founder_name', label: 'Founder Name & Title' },

  // Team
  { section: 'Team Section', key: 'about_team_title', label: 'Section Title' },
  { section: 'Team Section', key: 'about_team_subtitle', label: 'Section Subtitle' },
  { section: 'Team Section', key: 'about_member1_name', label: 'Member 1 – Name' },
  { section: 'Team Section', key: 'about_member1_role', label: 'Member 1 – Role' },
  { section: 'Team Section', key: 'about_member1_bio', label: 'Member 1 – Bio', multiline: true },
  { section: 'Team Section', key: 'about_member2_name', label: 'Member 2 – Name' },
  { section: 'Team Section', key: 'about_member2_role', label: 'Member 2 – Role' },
  { section: 'Team Section', key: 'about_member2_bio', label: 'Member 2 – Bio', multiline: true },

  // CTA
  { section: 'Call to Action Banner', key: 'about_cta_headline', label: 'CTA Headline' },
  { section: 'Call to Action Banner', key: 'about_cta_subtext', label: 'CTA Sub-text', multiline: true },
];

// Image fields config
const IMAGE_FIELDS: { key: string; label: string; section: string }[] = [
  { key: 'about_founder_image', label: 'Founder Photo', section: "Founder's Note" },
  { key: 'about_member1_image', label: 'Member 1 – Photo', section: 'Team Section' },
  { key: 'about_member2_image', label: 'Member 2 – Photo', section: 'Team Section' },
];

// Group fields by section
function groupBySection(fields: FieldConfig[]): Map<string, FieldConfig[]> {
  const map = new Map<string, FieldConfig[]>();
  for (const f of fields) {
    if (!map.has(f.section)) map.set(f.section, []);
    map.get(f.section)!.push(f);
  }
  return map;
}

// ── Image Upload Widget ────────────────────────────────────────
function ImageUploadWidget({
  settingKey,
  label,
  currentUrl,
  onUploaded,
  onDeleted,
}: {
  settingKey: string;
  label: string;
  currentUrl: string;
  onUploaded: (url: string) => void;
  onDeleted: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate client-side
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, or WebP images allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB');
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('settingKey', settingKey);
      const { data } = await adminApi.uploadAboutImage(fd);
      if (data.data?.url) {
        onUploaded(data.data.url);
        toast.success(`${label} uploaded!`);
      }
    } catch {
      toast.error(`Failed to upload ${label}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Remove this ${label}?`)) return;
    setDeleting(true);
    try {
      await adminApi.deleteAboutImage(settingKey);
      onDeleted();
      toast.success(`${label} removed`);
    } catch {
      toast.error('Failed to remove image');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-surface-700 mb-1.5">{label}</label>
      <div className="flex items-start gap-4">
        {/* Preview */}
        <div className="w-24 h-24 rounded-xl border-2 border-dashed border-surface-200 bg-surface-50 flex items-center justify-center overflow-hidden shrink-0">
          {currentUrl ? (
            <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
          ) : (
            <svg className="w-8 h-8 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="btn-primary text-xs px-4 py-2"
          >
            {uploading ? <Spinner size="sm" /> : currentUrl ? 'Replace' : 'Upload'}
          </button>
          {currentUrl && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="btn-ghost text-xs text-red-600 px-4 py-2"
            >
              {deleting ? <Spinner size="sm" /> : 'Remove'}
            </button>
          )}
          <p className="text-[10px] text-surface-400">JPG, PNG, or WebP · Max 5 MB</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function AdminAboutPage(): React.ReactElement {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then(({ data }) => {
      if (data.data) {
        const merged: Record<string, string> = { ...DEFAULT_VALUES };
        for (const key of ABOUT_KEYS) {
          if (data.data[key] !== undefined) merged[key] = data.data[key];
        }
        setFields(merged);
      } else {
        setFields({ ...DEFAULT_VALUES });
      }
    }).catch(() => {
      setFields({ ...DEFAULT_VALUES });
      toast.error('Failed to load settings, showing defaults');
    }).finally(() => setLoading(false));
  }, []);

  const updateField = (key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const resetDefaults = () => {
    setFields({ ...DEFAULT_VALUES });
    toast('Reset to defaults (not saved yet)', { icon: '🔄' });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save text fields only (images are saved immediately on upload)
      const textKeys = ABOUT_KEYS.filter(k => !k.endsWith('_image'));
      const updates = textKeys.map(key => ({ key, value: fields[key] ?? '' }));
      await adminApi.updateSettings(updates);
      toast.success('About Us page saved successfully!');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const sections = groupBySection(FIELDS);

  // Helper: get image fields for a section
  const getImageFields = (sectionName: string) =>
    IMAGE_FIELDS.filter(f => f.section === sectionName);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">About Us Page</h1>
          <p className="text-surface-500 text-sm mt-1">
            Edit all content shown on the public <strong>/about</strong> page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetDefaults}
            className="btn-ghost text-sm text-surface-500"
            type="button"
          >
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            id="about-save-btn"
            type="button"
          >
            {saving ? <Spinner size="sm" /> : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Live preview link */}
      <div className="mb-6 p-3 bg-primary-50 border border-primary-100 rounded-xl flex items-center gap-3 text-sm text-primary-700">
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          Changes are visible immediately after saving. Images upload instantly. Preview at{' '}
          <a href="/about" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            /about ↗
          </a>
        </span>
      </div>

      {/* Sections */}
      <div className="space-y-6 max-w-3xl">
        {[...sections.entries()].map(([sectionName, sectionFields]) => {
          const sectionImages = getImageFields(sectionName);

          return (
            <div key={sectionName} className="card p-6 space-y-5">
              <h3 className="font-semibold text-surface-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                {sectionName}
              </h3>

              {/* Image upload widgets for this section */}
              {sectionImages.length > 0 && (
                <div className="space-y-4 pb-4 border-b border-surface-100">
                  {sectionImages.map(imgField => (
                    <ImageUploadWidget
                      key={imgField.key}
                      settingKey={imgField.key}
                      label={imgField.label}
                      currentUrl={fields[imgField.key] || ''}
                      onUploaded={(url) => updateField(imgField.key, url)}
                      onDeleted={() => updateField(imgField.key, '')}
                    />
                  ))}
                </div>
              )}

              {/* Text fields */}
              {sectionFields.map(field => (
                <div key={field.key}>
                  <label
                    htmlFor={`about-field-${field.key}`}
                    className="block text-sm font-medium text-surface-700 mb-1.5"
                  >
                    {field.label}
                  </label>
                  {field.multiline ? (
                    <textarea
                      id={`about-field-${field.key}`}
                      className="input-field min-h-[80px] resize-y text-sm"
                      value={fields[field.key] ?? ''}
                      onChange={e => updateField(field.key, e.target.value)}
                      placeholder={DEFAULT_VALUES[field.key]}
                    />
                  ) : (
                    <input
                      id={`about-field-${field.key}`}
                      type="text"
                      className="input-field text-sm"
                      value={fields[field.key] ?? ''}
                      onChange={e => updateField(field.key, e.target.value)}
                      placeholder={DEFAULT_VALUES[field.key]}
                    />
                  )}
                </div>
              ))}
            </div>
          );
        })}

        {/* Save footer */}
        <div className="flex justify-end gap-3 pt-2 pb-6">
          <button onClick={resetDefaults} className="btn-ghost text-sm text-surface-500" type="button">
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            type="button"
          >
            {saving ? <Spinner size="sm" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
