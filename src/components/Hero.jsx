import React from 'react';
import { Calendar, Play, Send, MapPin, Disc, Headphones } from 'lucide-react';

export default function Hero({ profile, onScrollTo }) {
  const djImage = profile.hero_image_url || '/images/dj-samizen.png';

  return (
    <section id="hero" className="hero-section">
      {/* Background ambient lighting */}
      <div className="hero-backdrop">
        <div className="hero-mesh-overlay"></div>
        <div className="hero-ambient-canvas">
          <div className="ambient-glow glow-1"></div>
          <div className="ambient-glow glow-2"></div>
        </div>
        <div className="hero-gradient-bottom"></div>
      </div>

      <div className="container hero-container">
        <div className="hero-split-grid">
          {/* Left Column: Hero Typography & CTAs */}
          <div className="hero-text-col">
            {/* Brand Tagline Banner */}
            <div className="hero-badge-pill">
              <span className="live-dot"></span>
              <span className="hero-badge-text">{profile.tagline || 'AFRO-URBAN SOUND. UNFORGETTABLE MOMENTS.'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="hero-headline">
              {profile.dj_name || 'DJ SAMIZEN'}
              <br />
              <span className="hero-headline-accent">AFRO-URBAN</span> SOUND
            </h1>

            {/* Subtitle */}
            <p className="hero-subtext">
              {profile.bio || 'Delivering premium Afro-urban sound, curated club sets, and unforgettable dancefloor moments across Kenya and beyond.'}
            </p>

            {/* Location & Residency (if configured) */}
            {(profile.location || profile.residency) && (
              <div className="hero-location-bar">
                {profile.location && (
                  <div className="loc-item">
                    <MapPin size={16} className="loc-icon" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.location && profile.residency && <span className="loc-separator">•</span>}
                {profile.residency && (
                  <div className="loc-item">
                    <Disc size={16} className="loc-icon" />
                    <span>{profile.residency}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="hero-cta-group">
              <button 
                onClick={() => onScrollTo('booking')} 
                className="btn btn-primary hero-btn"
              >
                <Send size={18} />
                <span>Book DJ Samizen</span>
              </button>

              <button 
                onClick={() => onScrollTo('mixes')} 
                className="btn btn-secondary hero-btn"
              >
                <Play size={18} />
                <span>Listen to Mixes</span>
              </button>

              <button 
                onClick={() => onScrollTo('events')} 
                className="btn btn-outline hero-btn"
              >
                <Calendar size={18} />
                <span>Events & Gigs</span>
              </button>
            </div>
          </div>

          {/* Right Column: Real DJ Samizen Image Beside Hero Text */}
          <div className="hero-visual-col">
            <div className="hero-portrait-frame">
              <div className="portrait-glow-halo"></div>
              <div className="portrait-inner-card">
                <img
                  src={djImage}
                  alt={profile.dj_name || 'DJ Samizen live on the decks'}
                  className="hero-dj-img"
                />
                <div className="portrait-glass-overlay"></div>
                
                {/* Live Performance Tag */}
                <div className="dj-status-badge">
                  <span className="badge-pulse-dot"></span>
                  <div className="badge-text-group">
                    <span className="badge-title">DJ SAMIZEN</span>
                    <span className="badge-role">LIVE ON THE DECKS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
