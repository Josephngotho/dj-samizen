import React, { useState } from 'react';
import { Calendar, MapPin, Clock, Ticket, Send } from 'lucide-react';

export default function EventsSection({ events = [], onBookClick }) {
  const [filter, setFilter] = useState('upcoming');

  const upcomingEvents = events.filter((e) => e.status === 'upcoming');
  const pastEvents = events.filter((e) => e.status === 'past');

  const filteredEvents = events.filter((evt) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return evt.status === 'upcoming';
    if (filter === 'past') return evt.status === 'past';
    return true;
  });

  const formatDateNairobi = (dateStr) => {
    try {
      if (!dateStr) return { day: '--', month: 'TBD', year: '' };
      const normalizedStr = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00+03:00`;
      const date = new Date(normalizedStr);
      const day = date.toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi', day: '2-digit' });
      const month = date.toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi', month: 'short' }).toUpperCase();
      const year = date.toLocaleDateString('en-GB', { timeZone: 'Africa/Nairobi', year: 'numeric' });
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
              Public club appearances, festival lineups, and live sets by Dj Samizen.
            </p>
          </div>

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

        {filteredEvents.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon-hub">
              <Calendar size={32} />
            </div>
            <h3 className="empty-title">No upcoming events scheduled right now.</h3>
            <p className="empty-sub">
              Tour dates are published as venue residencies and festival dates are confirmed. Planning a club night or private event?
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
              const { day, month, year } = formatDateNairobi(evt.event_date);
              const isPast = evt.status === 'past';
              const flyerSrc = evt.flyer_url || '/images/dj-samizen.png';

              return (
                <div key={evt.id} className={`event-card-v2 ${isPast ? 'event-past' : ''}`}>
                  {/* Immediate 4:5 Aspect Ratio Flyer Image */}
                  <div className="event-card-flyer-wrap">
                    <img
                      src={flyerSrc}
                      alt={`${evt.title} Official Flyer`}
                      className="event-card-flyer-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = '/images/dj-samizen.png';
                      }}
                    />
                    <div className="event-flyer-badges">
                      <span className="event-date-chip">
                        {month} {day}
                      </span>
                      {evt.status === 'upcoming' && <span className="badge badge-live">LIVE</span>}
                      {evt.status === 'sold_out' && (
                        <span className="badge badge-tag" style={{ color: '#ff4444', borderColor: '#ff4444' }}>
                          SOLD OUT
                        </span>
                      )}
                      {isPast && <span className="badge badge-tag">PAST</span>}
                    </div>
                  </div>

                  {/* Event Details Content */}
                  <div className="event-card-body">
                    <div className="event-card-meta-top">
                      {evt.category && <span className="event-category-label">{evt.category}</span>}
                      <span className="event-year-label">{year}</span>
                    </div>

                    <h3 className="event-card-title" title={evt.title}>
                      {evt.title}
                    </h3>

                    <div className="event-card-info-list">
                      <div className="event-info-row" title={`${evt.venue} — ${evt.city || 'Nairobi'}`}>
                        <MapPin size={13} className="info-icon" />
                        <span>
                          <strong>{evt.venue}</strong>
                          {evt.city ? ` • ${evt.city}` : ''}
                        </span>
                      </div>

                      {evt.event_time && (
                        <div className="event-info-row">
                          <Clock size={13} className="info-icon" />
                          <span>{evt.event_time}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="event-card-footer">
                      {evt.ticket_url && !isPast ? (
                        <a
                          href={evt.ticket_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm btn-card-action"
                        >
                          <Ticket size={14} />
                          <span>Tickets</span>
                        </a>
                      ) : !isPast ? (
                        <button
                          onClick={() => onBookClick(evt.title)}
                          className="btn btn-primary btn-sm btn-card-action"
                        >
                          <Send size={13} />
                          <span>Book VIP</span>
                        </button>
                      ) : (
                        <span className="event-completed-tag">Concluded</span>
                      )}
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
