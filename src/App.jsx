import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import EventsSection from './components/EventsSection';
import MixesSection from './components/MixesSection';
import GenresSection from './components/GenresSection';
import AboutPressKit from './components/AboutPressKit';
import BookingSection from './components/BookingSection';
import Footer from './components/Footer';
import AdminDashboard from './components/AdminDashboard';
import ResetPassword from './components/ResetPassword';

import {
  getProfile,
  getEvents,
  getCategories,
  getMixes,
  getSocialLinks,
  getBookings
} from './lib/supabase';
import {
  INITIAL_PROFILE,
  INITIAL_CATEGORIES,
  INITIAL_EVENTS,
  INITIAL_MIXES,
  INITIAL_BOOKINGS,
  INITIAL_SOCIALS
} from './lib/initialData';

export default function App() {
  // Detect Supabase password-reset landing page
  const [isResetPasswordRoute] = useState(() => {
    return window.location.pathname === '/reset-password';
  });

  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [mixes, setMixes] = useState(INITIAL_MIXES);
  const [socialLinks, setSocialLinks] = useState(INITIAL_SOCIALS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [prefilledEvent, setPrefilledEvent] = useState('');
  const [loading, setLoading] = useState(true);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('samizen_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('samizen_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const loadAllData = async () => {
    try {
      const [p, e, c, m, s, b] = await Promise.all([
        getProfile(),
        getEvents(),
        getCategories(),
        getMixes(),
        getSocialLinks(),
        getBookings()
      ]);
      if (p) setProfile(p);
      if (e) setEvents(e);
      if (c) setCategories(c);
      if (m) setMixes(m);
      if (s) setSocialLinks(s);
      if (b) setBookings(b);
    } catch (err) {
      console.warn('Error loading app data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const scrollToSection = (sectionId) => {
    if (isAdminOpen) {
      setIsAdminOpen(false);
    }
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleBookEvent = (eventName = '') => {
    setPrefilledEvent(eventName);
    scrollToSection('booking');
  };

  // Password-reset route — render only the reset page, no nav/footer
  if (isResetPasswordRoute) {
    const handleBackToLogin = () => {
      // Navigate to root, clear the recovery URL params, and open admin portal
      window.history.replaceState({}, '', '/');
      setIsAdminOpen(true);
    };
    return (
      <div className="app-root" data-theme={theme}>
        <ResetPassword onBackToLogin={handleBackToLogin} />
      </div>
    );
  }

  return (
    <div className="app-root">
      {/* Top Navigation */}
      <Navbar
        onNavigate={scrollToSection}
        onOpenAdmin={setIsAdminOpen}
        isAdminOpen={isAdminOpen}
        profile={profile}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {isAdminOpen ? (
        <AdminDashboard
          profile={profile}
          events={events}
          bookings={bookings}
          mixes={mixes}
          categories={categories}
          socialLinks={socialLinks}
          onRefreshData={loadAllData}
          onClose={() => setIsAdminOpen(false)}
        />
      ) : (
        <main>
          {/* Hero Section */}
          <Hero
            profile={profile}
            onScrollTo={scrollToSection}
          />

          {/* Events Section */}
          <EventsSection
            events={events}
            onBookClick={handleBookEvent}
          />

          {/* Sound Vault & Curated Mixes (YouTube external) */}
          <MixesSection mixes={mixes} />

          {/* Music Palette & Genres */}
          <GenresSection categories={categories} />

          {/* About & Technical Rider */}
          <AboutPressKit
            profile={profile}
            onBookClick={handleBookEvent}
          />

          {/* Direct Booking Engine */}
          <BookingSection
            profile={profile}
            prefilledEvent={prefilledEvent}
          />
        </main>
      )}

      {/* Footer */}
      <Footer
        profile={profile}
        socialLinks={socialLinks}
        onOpenAdmin={setIsAdminOpen}
        onScrollTo={scrollToSection}
      />
    </div>
  );
}
