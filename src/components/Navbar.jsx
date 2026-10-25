import React, { useState, useEffect } from 'react';
import { Menu, X, Music, Calendar, Radio, User, Send, Shield, Sun, Moon } from 'lucide-react';

export default function Navbar({ onNavigate, onOpenAdmin, isAdminOpen, profile, theme = 'dark', onToggleTheme }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'mixes', label: 'Mixes', icon: Radio },
    { id: 'genres', label: 'Genres', icon: Music },
    { id: 'about', label: 'About & Rider', icon: User },
    { id: 'booking', label: 'Book DJ', icon: Send },
  ];

  const handleLinkClick = (id) => {
    setMobileMenuOpen(false);
    if (isAdminOpen) {
      onOpenAdmin(false);
    }
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`navbar-header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container nav-container">
        {/* Brand Logo */}
        <a 
          href="#hero" 
          onClick={(e) => { e.preventDefault(); handleLinkClick('hero'); }}
          className="brand-logo"
        >
          <div className="brand-disc">
            <span className="brand-letter">S</span>
            <div className="equalizer-bars">
              <span className="eq-bar bar-1"></span>
              <span className="eq-bar bar-2"></span>
              <span className="eq-bar bar-3"></span>
            </div>
          </div>
          <div className="brand-text">
            <span className="brand-name">{profile?.dj_name || 'DJ SAMIZEN'}</span>
            <span className="brand-sub">AFRO-URBAN</span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id)}
              className="nav-link-btn"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Action CTAs */}
        <div className="nav-actions">
          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={onToggleTheme}
            className="theme-toggle-btn"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button 
            onClick={() => handleLinkClick('booking')} 
            className="btn btn-primary btn-sm nav-book-btn"
          >
            <Send size={15} />
            <span>Book DJ</span>
          </button>

          <button
            onClick={() => onOpenAdmin(!isAdminOpen)}
            className={`admin-toggle-btn ${isAdminOpen ? 'active' : ''}`}
            title={isAdminOpen ? 'Return to Website' : 'Admin Portal'}
          >
            <Shield size={16} />
            <span className="admin-btn-text">{isAdminOpen ? 'Exit' : 'Admin'}</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <nav className="mobile-nav-list">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => handleLinkClick(link.id)}
                  className="mobile-nav-item"
                >
                  <Icon size={18} className="mobile-nav-icon" />
                  <span>{link.label}</span>
                </button>
              );
            })}

            {/* Mobile Theme Row */}
            <div className="mobile-theme-row">
              <span>Theme: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              <button
                onClick={onToggleTheme}
                className="theme-toggle-btn"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>

            <div className="mobile-nav-actions">
              <button 
                onClick={() => handleLinkClick('booking')}
                className="btn btn-primary btn-full"
              >
                <Send size={16} />
                <span>Book DJ Samizen</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin(!isAdminOpen);
                }}
                className="btn btn-secondary btn-full"
              >
                <Shield size={16} />
                <span>{isAdminOpen ? 'Exit to Site' : 'Admin Management Portal'}</span>
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
