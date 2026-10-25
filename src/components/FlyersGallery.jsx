import React, { useState } from 'react';
import { Eye, X, ZoomIn, Calendar } from 'lucide-react';

export default function FlyersGallery({ flyers = [] }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeFlyer, setActiveFlyer] = useState(null);

  const categories = ['all', ...new Set(flyers.map(f => f.category).filter(Boolean))];

  const filteredFlyers = activeCategory === 'all'
    ? flyers
    : flyers.filter(f => f.category === activeCategory);

  return (
    <section id="flyers" className="flyers-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Visual Archives</span>
          <h2 className="section-title">FLYERS & MEDIA SHOWCASE</h2>
          <p className="section-subtitle">
            A visual retrospective of premier nightlife campaigns, festival headliners, and club flyers across Kenya.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flyer-filter-row">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flyer-filter-btn ${activeCategory === cat ? 'active' : ''}`}
            >
              {cat === 'all' ? 'All Posters' : cat}
            </button>
          ))}
        </div>

        {/* Flyers Grid */}
        <div className="flyers-grid">
          {filteredFlyers.map((flyer) => (
            <div
              key={flyer.id}
              className="flyer-item-card"
              onClick={() => setActiveFlyer(flyer)}
            >
              <div className="flyer-img-wrap">
                <img
                  src={flyer.flyer_url}
                  alt={flyer.title}
                  className="flyer-thumb-img"
                  loading="lazy"
                />
                <div className="flyer-hover-overlay">
                  <div className="flyer-hover-action">
                    <ZoomIn size={22} />
                    <span>View Flyer</span>
                  </div>
                  <div className="flyer-hover-info">
                    <h4>{flyer.event_name}</h4>
                    <span>{flyer.year} • {flyer.category}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {activeFlyer && (
          <div className="modal-backdrop" onClick={() => setActiveFlyer(null)}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setActiveFlyer(null)} 
                className="modal-close-btn"
                aria-label="Close Lightbox"
              >
                <X size={24} />
              </button>
              <img
                src={activeFlyer.flyer_url}
                alt={activeFlyer.title}
                className="lightbox-main-img"
              />
              <div className="lightbox-footer">
                <div>
                  <h3 className="lightbox-title">{activeFlyer.title}</h3>
                  <p className="lightbox-sub">{activeFlyer.event_name} • {activeFlyer.category} ({activeFlyer.year})</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
