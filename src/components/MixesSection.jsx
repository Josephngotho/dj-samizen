import React from 'react';
import { ExternalLink, Radio } from 'lucide-react';
import { extractYouTubeId } from '../lib/supabase';

const YouTubeIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function MixesSection({ mixes = [] }) {
  // Filter only published mixes
  const publishedMixes = mixes.filter(m => m.is_published !== false);

  return (
    <section id="mixes" className="mixes-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Curated Sets & Mixes</span>
          <h2 className="section-title">THE SOUND VAULT</h2>
          <p className="section-subtitle">
            Live club recordings, Afro-urban sets, and festival selections by Dj Samizen.
          </p>
        </div>

        {publishedMixes.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon-hub">
              <Radio size={32} />
            </div>
            <h3 className="empty-title">No mixes published yet.</h3>
            <p className="empty-sub">
              Studio sessions and live YouTube sets will appear here once released. Check back soon.
            </p>
          </div>
        ) : (
          <div className="mixes-grid">
            {publishedMixes.map((mix) => {
              const targetUrl = mix.youtube_url || mix.audio_url || mix.stream_url || '#';
              const ytId = extractYouTubeId(targetUrl);
              const artworkSrc = mix.artwork_url || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '/images/dj-samizen.png');

              return (
                <div key={mix.id} className="mix-card">
                  {/* Artwork Image Cover */}
                  <div className="mix-artwork-wrap">
                    <img
                      src={artworkSrc}
                      alt={mix.title}
                      className="mix-artwork-img"
                      loading="lazy"
                      onError={(e) => {
                        if (ytId) {
                          e.currentTarget.src = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                        } else {
                          e.currentTarget.src = '/images/dj-samizen.png';
                        }
                      }}
                    />
                    <div className="mix-artwork-overlay">
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mix-play-badge"
                        title="Open on YouTube"
                        aria-label={`Open ${mix.title} on YouTube`}
                      >
                        <YouTubeIcon size={20} />
                      </a>
                    </div>
                    {mix.duration && <span className="mix-duration-chip">{mix.duration}</span>}
                  </div>

                  {/* Mix Information */}
                  <div className="mix-card-body">
                    {mix.genre && <span className="mix-genre-pill">{mix.genre}</span>}
                    <h3 className="mix-title" title={mix.title}>
                      {mix.title}
                    </h3>

                    {/* Listen on YouTube Action Button */}
                    <div className="mix-card-actions">
                      <a
                        href={targetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-youtube btn-sm btn-block"
                      >
                        <YouTubeIcon size={16} />
                        <span>Listen on YouTube</span>
                        <ExternalLink size={13} style={{ marginLeft: 'auto', opacity: 0.7 }} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
