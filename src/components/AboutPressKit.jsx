import React, { useState } from 'react';
import { Sliders, CheckCircle2, FileText, ChevronRight } from 'lucide-react';

export default function AboutPressKit({ profile, onBookClick }) {
  const [activeTab, setActiveTab] = useState('bio');
  const portraitImg = profile.hero_image_url || '/images/dj-samizen.png';

  return (
    <section id="about" className="about-section">
      <div className="container">
        <div className="about-grid">
          {/* Visual Column */}
          <div className="about-visual-column">
            <div className="about-image-card">
              <img
                src={portraitImg}
                alt={profile.dj_name || 'Dj Samizen'}
                className="about-portrait"
              />
            </div>
          </div>

          {/* Content Column */}
          <div className="about-content-column">
            <span className="section-tag">Identity & Technical Rider</span>
            <h2 className="section-title">ABOUT & TECHNICAL SPECIFICATIONS</h2>

            {/* Tabs for Bio vs Rider */}
            <div className="about-tab-nav">
              <button
                onClick={() => setActiveTab('bio')}
                className={`about-tab-btn ${activeTab === 'bio' ? 'active' : ''}`}
              >
                Profile & Philosophy
              </button>
              <button
                onClick={() => setActiveTab('rider')}
                className={`about-tab-btn ${activeTab === 'rider' ? 'active' : ''}`}
              >
                Technical Rider (Promoters & Venues)
              </button>
            </div>

            {/* Tab 1: Bio */}
            {activeTab === 'bio' && (
              <div className="tab-pane-content">
                <div className="bio-lead-quote">
                  "{profile.tagline || 'Afro-urban sound. Unforgettable moments.'}"
                </div>

                <div className="bio-paragraphs">
                  {profile.bio ? (
                    profile.bio.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))
                  ) : (
                    <p>
                      DJ Samizen is a dedicated Afro-urban selector focused on blending modern African music—Afrobeats, Amapiano, Kenyan urban rhythms, and dancehall—into cohesive, high-energy live experiences.
                    </p>
                  )}
                </div>

                <div className="about-actions-row">
                  <button
                    onClick={() => onBookClick()}
                    className="btn btn-primary"
                  >
                    <span>Inquire for Booking</span>
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Technical Rider */}
            {activeTab === 'rider' && (
              <div className="tab-pane-content">
                <p className="rider-intro">
                  To ensure optimal acoustic fidelity and seamless technical performance, event promoters and venues should provide the following equipment:
                </p>

                <div className="rider-checklist">
                  <div className="rider-spec-box">
                    <h4 className="rider-box-title">
                      <Sliders size={18} className="rider-box-icon" />
                      DJ Booth Equipment (Pioneer Pro DJ)
                    </h4>
                    <ul className="spec-list">
                      <li><CheckCircle2 size={16} className="spec-check" /> 2x Pioneer CDJ-3000 (or CDJ-2000NXS2) multi-players</li>
                      <li><CheckCircle2 size={16} className="spec-check" /> 1x Pioneer DJM-A9 or DJM-900NXS2 mixer</li>
                      <li><CheckCircle2 size={16} className="spec-check" /> High-speed LAN switch connecting CDJs and mixer</li>
                      <li><CheckCircle2 size={16} className="spec-check" /> 2x Active booth monitor speakers with independent booth level control</li>
                    </ul>
                  </div>

                  <div className="rider-spec-box">
                    <h4 className="rider-box-title">
                      <FileText size={18} className="rider-box-icon" />
                      Power, Audio & Stage Requirements
                    </h4>
                    <ul className="spec-list">
                      <li><CheckCircle2 size={16} className="spec-check" /> 1x Wireless microphone on a dedicated mixer channel</li>
                      <li><CheckCircle2 size={16} className="spec-check" /> Clean, surge-protected power connection at the DJ console</li>
                      <li><CheckCircle2 size={16} className="spec-check" /> Stable, vibration-isolated table set at standard DJ height</li>
                    </ul>
                  </div>
                </div>

                <div className="about-actions-row">
                  <button
                    onClick={() => onBookClick('Technical Rider Inquiry')}
                    className="btn btn-primary"
                  >
                    <span>Confirm Rider & Book Date</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
