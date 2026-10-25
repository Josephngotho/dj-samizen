import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Ticket, Image as ImageIcon, X, Send } from 'lucide-react';

export default function EventsSection({ events = [], onBookClick }) {
  const [filter, setFilter] = useState('upcoming');
  const [selectedFlyer, setSelectedFlyer] = useState(null);

  const upcomingEvents = events.filter(e => e.status === 'upcoming');
  const pastEvents = events.filter(e => e.status === 'past');

  const filteredEvents = events.filter((evt) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return evt.status === 'upcoming';
    if (filter === 'past') return evt.status === 'past';
    return true;
  });

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
      const year = date.getFullYear();
      return { day, month, year };
    } catch {
      return { day: '--', month: 'TBD', year: '' };
    }
  };

  return (
    <section id="events" className="events-section">
      <div className="container">
        <div className="events-header-row">
          <div>
            <span className="section-tag">Performances & Tour</span>
            <h2 className="section-title">EVENTS & TOUR DATES</h2>
            <p className="section-subtitle">
              Public club dates, festivals, and live appearances by DJ Samizen.
            </p>
          </div>

          {/* Filter Pills (only show if events exist) */}
          {events.length > 0 && (
            <div className="events-filter-bar">
              <button
                onClick={() => setFilter('upcoming')}
                className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
              >
                Upcoming ({upcomingEvents.length})
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              >
                All ({events.length})
              </button>
              {pastEvents.length > 0 && (
                <button
                  onClick={() => setFilter('past')}
                  className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
                >
                  Past ({pastEvents.length})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Events Grid or Clean Empty State */}
        {filteredEvents.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon-hub">
              <Calendar size={32} />
            </div>
            <h3 className="empty-title">No upcoming events at the moment. Check back soon.</h3>
            <p className="empty-sub">
              Dates are updated as club residencies and festival appearances are confirmed. Planning a private event or festival?
            </p>
            <button
              onClick={() => onBookClick()}
              className="btn btn-primary"
              style={{ marginTop: '1.25rem' }}
            >
              <Send size={16} />
              <span>Inquire for Booking</span>
            </button>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((evt) => {
              const { day, month, year } = formatDate(evt.event_date);
              const isPast = evt.status === 'past';

              return (
                <div key={evt.id} className={`event-card ${isPast ? 'event-past' : ''}`}>
                  <div className="event-date-block">
                    <span className="event-month">{month}</span>
                    <span className="event-day">{day}</span>
                    <span className="event-year">{year}</span>
                  </div>

                  <div className="event-details">
                    <div className="event-tags-row">
                      {evt.category && <span className="badge badge-tag">{evt.category}</span>}
                      {evt.status === 'upcoming' && <span className="badge badge-live">CONFIRMED</span>}
                      {evt.status === 'sold_out' && <span className="badge badge-tag" style={{ color: '#ff4444' }}>SOLD OUT</span>}
                      {isPast && <span className="badge badge-tag">PAST</span>}
                    </div>

                    <h3 className="event-name">{evt.title}</h3>

                    <div className="event-meta-info">
                      <div className="meta-item">
                        <MapPin size={15} className="meta-icon" />
                        <span><strong>{evt.venue}</strong> {evt.city ? `— ${evt.city}` : ''}</span>
                      </div>
                      {evt.event_time && (
                        <div className="meta-item">
                          <Clock size={15} className="meta-icon" />
                          <span>{evt.event_time}</span>
                        </div>
                      )}
                    </div>

                    {evt.description && <p className="event-desc">{evt.description}</p>}
                  </div>

                  <div className="event-actions">
                    {evt.ticket_url && !isPast && (
                      <a
                        href={evt.ticket_url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary btn-sm"
                      >
                        <Ticket size={15} />
                        <span>Tickets / RSVP</span>
                      </a>
                    )}

                    {!isPast && (
                      <button
                        onClick={() => onBookClick(evt.title)}
                        className="btn btn-secondary btn-sm"
                      >
                        <span>VIP / Booking</span>
                      </button>
                    )}

                    {evt.flyer_url && (
                      <button
                        onClick={() => setSelectedFlyer(evt)}
                        className="btn btn-outline btn-sm"
                        title="View Official Flyer"
                      >
                        <ImageIcon size={15} />
                        <span>Flyer</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for viewing real flyer if present */}
        {selectedFlyer && (
          <div className="modal-backdrop" onClick={() => setSelectedFlyer(null)}>
            <div className="modal-flyer-content" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setSelectedFlyer(null)} 
                className="modal-close-btn"
                aria-label="Close Flyer Modal"
              >
                <X size={22} />
              </button>
              <img
                src={selectedFlyer.flyer_url}
                alt={`${selectedFlyer.title} Flyer`}
                className="modal-flyer-img"
              />
              <div className="modal-flyer-caption">
                <h4>{selectedFlyer.title}</h4>
                <p>{selectedFlyer.venue} {selectedFlyer.city ? `• ${selectedFlyer.city}` : ''}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
