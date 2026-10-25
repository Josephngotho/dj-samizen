import React from 'react';
import { User, ArrowUp, Mail, Phone, MapPin, MessageSquare } from 'lucide-react';

const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const YoutubeIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
    <polygon points="10 15 15 12 10 9 10 15" fill="currentColor"/>
  </svg>
);

const TikTokIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
  </svg>
);

const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const XIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export default function Footer({ profile, socialLinks = [], onOpenAdmin, onScrollTo }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasPhone = Boolean(profile.booking_phone);
  const hasEmail = Boolean(profile.booking_email);
  const hasWhatsApp = Boolean(profile.booking_whatsapp);

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <div className="brand-logo">
              <div className="brand-disc">
                <span className="brand-letter">S</span>
              </div>
              <div className="brand-text">
                <span className="brand-name">{profile.dj_name || 'DJ SAMIZEN'}</span>
                <span className="brand-sub">AFRO-URBAN</span>
              </div>
            </div>

            <p className="footer-tagline">
              {profile.tagline || 'Afro-urban sound. Unforgettable moments.'}
            </p>
            <p className="footer-desc">
              {profile.short_bio || 'Official website and booking portal for DJ Samizen. Delivering premium Afro-urban sound, curated club sets, and unforgettable dancefloor moments.'}
            </p>

            {/* Social links (only real configured links) */}
            {(socialLinks.length > 0 || hasWhatsApp) && (
              <div className="footer-social-row">
                {socialLinks.map((soc) => {
                  if (!soc.url) return null;
                  return (
                    <a
                      key={soc.id || soc.platform}
                      href={soc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="social-icon-btn"
                      aria-label={soc.platform}
                      title={soc.platform}
                    >
                      {soc.platform === 'facebook' && <FacebookIcon size={18} />}
                      {soc.platform === 'instagram' && <InstagramIcon size={18} />}
                      {soc.platform === 'tiktok' && <TikTokIcon size={18} />}
                      {soc.platform === 'youtube' && <YoutubeIcon size={18} />}
                      {soc.platform === 'x' && <XIcon size={16} />}
                    </a>
                  );
                })}

                {hasWhatsApp && (
                  <a
                    href={`https://wa.me/${profile.booking_whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="social-icon-btn"
                    aria-label="WhatsApp"
                    title="WhatsApp"
                  >
                    <MessageSquare size={18} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-link-list">
              <li><button onClick={() => onScrollTo('hero')}>Home</button></li>
              <li><button onClick={() => onScrollTo('events')}>Events & Gigs</button></li>
              <li><button onClick={() => onScrollTo('mixes')}>Sound Vault</button></li>
              <li><button onClick={() => onScrollTo('genres')}>Genres</button></li>
              <li><button onClick={() => onScrollTo('about')}>About & Rider</button></li>
              <li><button onClick={() => onScrollTo('booking')}>Book DJ</button></li>
            </ul>
          </div>

          {/* Real Contacts (only if configured) */}
          <div className="footer-col">
            <h4 className="footer-heading">Direct Inquiries</h4>
            {profile.location && (
              <div className="footer-contact-item">
                <MapPin size={16} className="f-icon" />
                <span>{profile.location}</span>
              </div>
            )}
            {hasPhone && (
              <div className="footer-contact-item">
                <Phone size={16} className="f-icon" />
                <span>{profile.booking_phone}</span>
              </div>
            )}
            {hasEmail && (
              <div className="footer-contact-item">
                <Mail size={16} className="f-icon" />
                <span>{profile.booking_email}</span>
              </div>
            )}
            {hasWhatsApp && (
              <div className="footer-contact-item">
                <MessageSquare size={16} className="f-icon" />
                <span>WhatsApp: {profile.booking_whatsapp}</span>
              </div>
            )}
            {!hasPhone && !hasEmail && !hasWhatsApp && (
              <p className="footer-desc">Use the booking inquiry form on this site to connect with management.</p>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <p className="copyright-text">
            © {new Date().getFullYear()} {profile.dj_name || 'DJ Samizen'}. Afro-Urban Sound. All Rights Reserved.
          </p>

          <div className="footer-bottom-actions">
            <button onClick={() => onOpenAdmin(true)} className="footer-signin-link" title="Portal Sign In">
              <User size={13} />
              <span>Sign In</span>
            </button>

            <button onClick={scrollToTop} className="scroll-top-btn" aria-label="Scroll to top">
              <ArrowUp size={16} />
              <span>Back to Top</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
