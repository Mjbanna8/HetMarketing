import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api';
import { Spinner } from '../../components/Shared';
import toast from 'react-hot-toast';

// All About Us keys stored in SiteSetting
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
  'about_team_title',
  'about_team_subtitle',
  'about_member1_name',
  'about_member1_role',
  'about_member1_bio',
  'about_member2_name',
  'about_member2_role',
  'about_member2_bio',
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
  about_founder_bio1: "My name is Hitesh, and I started HetMarketing with a simple observation: modern e-commerce has become too cold, too mechanical. We missed the feeling of talking to a merchant who understands our needs.",
  about_founder_bio2: "HetMarketing isn't just a platform; it's a bridge. By leveraging WhatsApp, we create a shopping experience that feels like a conversation with a trusted friend. Our mission is to curate the finest products and deliver them with the immediacy that the modern world demands.",
  about_founder_name: "Hitesh, Founder of HetMarketing",
  about_team_title: "The Precision Curators",
  about_team_subtitle: "The minds behind the invisible concierge experience.",
  about_member1_name: "Sarah Chen",
  about_member1_role: "Head of Curation",
  about_member1_bio: "Sarah leads our vetting team, ensuring every brand that joins HetMarketing meets our high-gloss editorial standards.",
  about_member2_name: "Marcus Thorne",
  about_member2_role: "Chief Integrationist",
  about_member2_bio: "Marcus oversees our API architecture, making the WhatsApp commerce experience seamless and lightning-fast.",
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
  { section: 'about_cta_subtext', key: 'about_cta_subtext', label: 'CTA Sub-text', multiline: true },
];

// Group fields by section
function groupBySection(fields: FieldConfig[]): Map<string, FieldConfig[]> {
  const map = new Map<string, FieldConfig[]>();
  for (const f of fields) {
    const sectionKey = f.section;
    if (!map.has(sectionKey)) map.set(sectionKey, []);
    map.get(sectionKey)!.push(f);
  }
  return map;
}

export default function AdminAboutPage(): React.ReactElement {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then(({ data }) => {
      if (data.data) {
        // Merge stored values with defaults so new keys always have defaults
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
      const updates = ABOUT_KEYS.map(key => ({ key, value: fields[key] ?? '' }));
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
          Changes are visible immediately after saving. Preview at{' '}
          <a href="/about" target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            /about ↗
          </a>
        </span>
      </div>

      {/* Sections */}
      <div className="space-y-6 max-w-3xl">
        {[...sections.entries()].map(([sectionName, sectionFields]) => (
          <div key={sectionName} className="card p-6 space-y-5">
            <h3 className="font-semibold text-surface-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
              {sectionName}
            </h3>

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
        ))}

        {/* Sticky Save footer */}
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
