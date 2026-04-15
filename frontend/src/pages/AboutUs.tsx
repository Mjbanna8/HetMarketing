import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { settingsApi } from '../api';

// Default copy – shown immediately while fetch is in-flight (no flash of empty)
const defaults: Record<string, string> = {
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

export default function AboutUs(): React.ReactElement {
  const [c, setC] = useState<Record<string, string>>(defaults);

  useEffect(() => {
    settingsApi.getPublic().then(({ data }) => {
      if (data.data) {
        setC(prev => {
          const next = { ...prev };
          // Overlay any about_* keys returned by the public settings endpoint
          for (const [k, v] of Object.entries(data.data as unknown as Record<string, string>)) {
            if (k.startsWith('about_') && v) next[k] = v;
          }
          return next;
        });
      }
    }).catch(() => {/* silently keep defaults */});
  }, []);

  const t = (key: string) => c[key] ?? defaults[key] ?? '';

  return (
    <div className="bg-surface-50 min-h-screen">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="container-page py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-surface-900 leading-tight tracking-tight mb-6">
              {t('about_hero_headline').includes('WhatsApp') ? (
                <>
                  {t('about_hero_headline').split('WhatsApp')[0]}
                  <span className="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                    WhatsApp
                  </span>
                  {t('about_hero_headline').split('WhatsApp')[1]}
                </>
              ) : t('about_hero_headline')}
            </h1>
            <p className="text-surface-500 text-lg leading-relaxed mb-8 max-w-md">
              {t('about_hero_tagline')}
            </p>
            <Link
              to="/products"
              className="btn-whatsapp inline-flex items-center gap-3 text-base px-8 py-4"
            >
              <WhatsAppIcon />
              Start Shopping
            </Link>
          </div>

          {/* Visual */}
          <div className="relative flex items-center justify-center">
            <div className="w-full max-w-sm aspect-square rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-2xl shadow-primary-200">
              <svg className="w-36 h-36 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-whatsapp shadow-lg flex items-center justify-center">
              <WhatsAppIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ─────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20">
        <div className="container-page">
          <div className="text-center mb-12">
            <h2 className="section-title">{t('about_why_title')}</h2>
            <div className="w-16 h-1 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full mx-auto mt-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<BadgeCheckIcon />}
              iconBg="bg-primary-100 group-hover:bg-primary-500"
              iconColor="text-primary-600 group-hover:text-white"
              title={t('about_feature1_title')}
              desc={t('about_feature1_desc')}
            />
            <FeatureCard
              icon={<WhatsAppIcon />}
              iconBg="bg-green-100 group-hover:bg-whatsapp"
              iconColor="text-green-600 group-hover:text-white"
              title={t('about_feature2_title')}
              desc={t('about_feature2_desc')}
            />
            <FeatureCard
              icon={<TagIcon />}
              iconBg="bg-red-100 group-hover:bg-red-500"
              iconColor="text-red-500 group-hover:text-white"
              title={t('about_feature3_title')}
              desc={t('about_feature3_desc')}
            />
          </div>
        </div>
      </section>

      {/* ── Founder's Note ────────────────────────────────────── */}
      <section className="container-page py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="relative flex justify-center md:justify-start">
            <div className="relative w-64 h-64 md:w-80 md:h-80">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-surface-200 to-surface-300 overflow-hidden flex items-center justify-center shadow-xl">
                {t('about_founder_image') ? (
                  <img
                    src={t('about_founder_image')}
                    alt={t('about_founder_name')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-40 h-40 text-surface-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                )}
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-white rounded-full px-4 py-2 shadow-lg border border-surface-100">
                {[ShareIcon, MailIcon, UserIcon].map((Icon, i) => (
                  <button key={i} className="w-7 h-7 rounded-full bg-surface-100 flex items-center justify-center hover:bg-primary-100 transition-colors">
                    <Icon className="w-4 h-4 text-surface-600" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-primary-500 mb-3">
              {t('about_founder_label')}
            </p>
            <blockquote className="text-2xl md:text-3xl font-bold text-surface-900 leading-tight mb-6 tracking-tight">
              {t('about_founder_quote')}
            </blockquote>
            <div className="space-y-4 text-surface-500 text-sm leading-relaxed">
              <p>{t('about_founder_bio1')}</p>
              <p>{t('about_founder_bio2')}</p>
            </div>
            <p className="mt-6 font-semibold text-surface-700 text-sm">{t('about_founder_name')}</p>
          </div>
        </div>
      </section>

      {/* ── Team ──────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20">
        <div className="container-page">
          <div className="mb-10">
            <h2 className="section-title">{t('about_team_title')}</h2>
            <p className="text-surface-500 mt-2 text-sm">{t('about_team_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
            <TeamCard
              gradient="from-primary-300 to-primary-500"
              name={t('about_member1_name')}
              role={t('about_member1_role')}
              bio={t('about_member1_bio')}
              imageUrl={t('about_member1_image')}
            />
            <TeamCard
              gradient="from-surface-600 to-surface-800"
              name={t('about_member2_name')}
              role={t('about_member2_role')}
              bio={t('about_member2_bio')}
              imageUrl={t('about_member2_image')}
            />
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="container-page py-16 md:py-20">
        <div className="rounded-3xl bg-gradient-to-br from-primary-600 to-primary-800 px-8 py-16 md:py-20 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">{t('about_cta_headline')}</h2>
            <p className="text-white/75 text-base mb-10 max-w-md mx-auto">{t('about_cta_subtext')}</p>
            <Link
              to="/products"
              className="btn-whatsapp inline-flex items-center gap-3 text-base px-10 py-4 shadow-xl shadow-black/20"
            >
              <WhatsAppIcon />
              Start Shopping
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    </svg>
  );
}

function BadgeCheckIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function ShareIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function MailIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function UserIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function FeatureCard({
  icon, iconBg, iconColor, title, desc,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-8 rounded-2xl bg-surface-50 hover:bg-white hover:shadow-lg transition-all duration-300 group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300 ${iconBg}`}>
        <span className={`transition-colors duration-300 ${iconColor}`}>{icon}</span>
      </div>
      <h3 className="font-bold text-surface-900 text-lg mb-2">{title}</h3>
      <p className="text-surface-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function TeamCard({
  gradient, name, role, bio, imageUrl,
}: {
  gradient: string;
  name: string;
  role: string;
  bio: string;
  imageUrl?: string;
}) {
  return (
    <div className="flex items-start gap-4 p-6 rounded-2xl bg-surface-50 hover:bg-white hover:shadow-md transition-all duration-300">
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} shrink-0 flex items-center justify-center overflow-hidden`}>
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        )}
      </div>
      <div>
        <h3 className="font-bold text-surface-900 text-base">{name}</h3>
        <p className="text-primary-600 text-xs font-semibold mb-2">{role}</p>
        <p className="text-surface-500 text-xs leading-relaxed">{bio}</p>
      </div>
    </div>
  );
}
