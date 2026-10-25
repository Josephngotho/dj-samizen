import React, { useState } from 'react';
import { Send, Phone, MessageSquare, Calendar, MapPin, CheckCircle2, Clock, AlertCircle, Mail } from 'lucide-react';
import { createBooking } from '../lib/supabase';

export default function BookingSection({ profile, prefilledEvent = '' }) {
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    event_type: 'Club Night / Residency',
    event_date: '',
    event_location: '',
    guest_count: '',
    budget_range: '',
    music_preferences: prefilledEvent ? `Inquiry regarding: ${prefilledEvent}` : '',
    additional_notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const hasPhone = Boolean(profile.booking_phone);
  const hasWhatsApp = Boolean(profile.booking_whatsapp);
  const hasEmail = Boolean(profile.booking_email);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_name || !formData.client_phone || !formData.event_date || !formData.event_location) {
      setErrorMsg('Please complete all required fields (Name, Contact, Date, and Location).');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await createBooking(formData);
      if (error) {
        setErrorMsg(error.message || 'Unable to submit booking inquiry to database. Please try again.');
        setSubmitted(false);
      } else {
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      setErrorMsg('An unexpected error occurred while submitting your booking inquiry. Please try again.');
      setSubmitted(false);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppDirect = () => {
    if (!hasWhatsApp) return;
    const whatsappNum = profile.booking_whatsapp.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello DJ Samizen! 🎧\n\nI would like to inquire about booking you for an event:\n\n` +
      `• Name: ${formData.client_name || 'Client'}\n` +
      `• Event Type: ${formData.event_type}\n` +
      `• Date: ${formData.event_date || 'Upcoming'}\n` +
      `• Location: ${formData.event_location || ''}\n` +
      `• Notes: ${formData.music_preferences || ''}\n\n` +
      `Looking forward to confirming availability!`
    );

    window.open(`https://wa.me/${whatsappNum}?text=${message}`, '_blank');
  };

  return (
    <section id="booking" className="booking-section">
      <div className="container">
        <div className="booking-layout-grid">
          {/* Left Info Panel */}
          <div className="booking-info-panel">
            <span className="section-tag">Booking & Availability</span>
            <h2 className="section-title">BOOK DJ SAMIZEN</h2>
            <p className="booking-intro-text">
              Available for club residencies, festival lineups, corporate events, and private bookings across Kenya and internationally.
            </p>

            <div className="booking-benefits-list">
              <div className="benefit-item">
                <CheckCircle2 size={18} className="benefit-icon" />
                <div>
                  <strong>Curated Sound Experience</strong>
                  <p>Custom Afro-urban sound tailored to your venue acoustics and crowd dynamic.</p>
                </div>
              </div>
              <div className="benefit-item">
                <CheckCircle2 size={18} className="benefit-icon" />
                <div>
                  <strong>Professional Event Coordination</strong>
                  <p>Prompt confirmation of dates, technical requirements, and schedules.</p>
                </div>
              </div>
            </div>

            {/* Direct Contacts (Only displayed if genuinely configured by the DJ) */}
            {(hasPhone || hasWhatsApp || hasEmail) && (
              <div className="direct-contact-box">
                <h4>Direct Contact Details</h4>
                {hasPhone && (
                  <div className="contact-line">
                    <Phone size={16} className="contact-icon" />
                    <span>Call: <strong>{profile.booking_phone}</strong></span>
                  </div>
                )}
                {hasWhatsApp && (
                  <div className="contact-line">
                    <MessageSquare size={16} className="contact-icon" />
                    <span>WhatsApp: <strong>{profile.booking_whatsapp}</strong></span>
                  </div>
                )}
                {hasEmail && (
                  <div className="contact-line">
                    <Mail size={16} className="contact-icon" />
                    <span>Email: <strong>{profile.booking_email}</strong></span>
                  </div>
                )}

                {hasWhatsApp && (
                  <button
                    type="button"
                    onClick={handleWhatsAppDirect}
                    className="btn btn-whatsapp btn-full"
                    style={{ marginTop: '1.25rem' }}
                  >
                    <MessageSquare size={18} />
                    <span>Chat on WhatsApp</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Form Panel */}
          <div className="booking-form-panel">
            {submitted ? (
              <div className="booking-success-box">
                <div className="success-icon-hub">
                  <CheckCircle2 size={48} className="success-icon" />
                </div>
                <h3>INQUIRY RECEIVED</h3>
                <p>
                  Thank you, <strong>{formData.client_name}</strong>. Your booking inquiry for <strong>{formData.event_date}</strong> has been received.
                </p>
                <p className="success-sub">
                  We will review the date and reach out via your contact details shortly.
                </p>
                <div className="success-actions">
                  {hasWhatsApp && (
                    <button
                      onClick={handleWhatsAppDirect}
                      className="btn btn-whatsapp"
                    >
                      <MessageSquare size={16} />
                      <span>Message on WhatsApp</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        client_name: '',
                        client_email: '',
                        client_phone: '',
                        event_type: 'Club Night / Residency',
                        event_date: '',
                        event_location: '',
                        guest_count: '',
                        budget_range: '',
                        music_preferences: '',
                        additional_notes: ''
                      });
                    }}
                    className="btn btn-secondary"
                  >
                    <span>Submit Another Inquiry</span>
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="booking-form">
                <h3 className="form-title">Booking Inquiry Form</h3>
                <p className="form-sub">Provide your event details to check availability.</p>

                {errorMsg && (
                  <div className="form-error-banner">
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Full Name / Organizer *</label>
                    <input
                      type="text"
                      name="client_name"
                      required
                      placeholder="Your name"
                      value={formData.client_name}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Phone / WhatsApp *</label>
                    <input
                      type="tel"
                      name="client_phone"
                      required
                      placeholder="e.g. +254..."
                      value={formData.client_phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="client_email"
                      placeholder="you@example.com"
                      value={formData.client_email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Event Type *</label>
                    <select
                      name="event_type"
                      value={formData.event_type}
                      onChange={handleChange}
                    >
                      <option value="Club Night / Residency">Club Night / Club Residency</option>
                      <option value="Music Festival / Concert">Music Festival / Concert</option>
                      <option value="Private Event">Private Party / Celebration</option>
                      <option value="Corporate Event">Corporate Event / Brand Launch</option>
                      <option value="Wedding">Wedding Reception</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Event Date *</label>
                    <input
                      type="date"
                      name="event_date"
                      required
                      value={formData.event_date}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-field">
                    <label>Venue / City *</label>
                    <input
                      type="text"
                      name="event_location"
                      required
                      placeholder="e.g. Nairobi"
                      value={formData.event_location}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Music Preferences / Special Requests</label>
                  <textarea
                    name="music_preferences"
                    rows="3"
                    placeholder="Describe the vibe, set duration, or specific music focus."
                    value={formData.music_preferences}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <div className="form-actions-row">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary btn-full"
                  >
                    <Send size={18} />
                    <span>{loading ? 'Submitting...' : 'Submit Booking Inquiry'}</span>
                  </button>

                  {hasWhatsApp && (
                    <button
                      type="button"
                      onClick={handleWhatsAppDirect}
                      className="btn btn-whatsapp btn-full"
                    >
                      <MessageSquare size={18} />
                      <span>Send via WhatsApp</span>
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
