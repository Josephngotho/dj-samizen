import React from 'react';
import { Disc } from 'lucide-react';

export default function GenresSection({ categories = [] }) {
  if (!categories || categories.length === 0) return null;

  return (
    <section id="genres" className="genres-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Sound Signature</span>
          <h2 className="section-title">GENRES & MUSIC PALETTE</h2>
          <p className="section-subtitle">
            Curated Afro-urban sound selection tailored to read the dancefloor and build unforgettable moments.
          </p>
        </div>

        <div className="genres-grid">
          {categories.map((cat) => (
            <div key={cat.id || cat.slug} className="genre-card">
              <div className="genre-card-header">
                <div className="genre-icon-hub">
                  <Disc size={20} className="genre-disc-icon" />
                </div>
              </div>

              <h3 className="genre-title">{cat.name}</h3>
              {cat.description && (
                <p className="genre-description">{cat.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
