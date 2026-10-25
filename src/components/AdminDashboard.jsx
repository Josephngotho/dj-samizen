import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Send,
  Radio,
  User,
  Database,
  Plus,
  Trash2,
  Edit2,
  MessageSquare,
  Lock,
  LogOut,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Copy,
  Tag,
  Share2,
  X,
  UploadCloud,
  Info,
  ShieldCheck,
  Check
} from 'lucide-react';

import {
  checkBackendStatus,
  createEvent,
  updateEvent,
  deleteEvent,
  uploadFlyer,
  deleteFlyer,
  getCurrentUser,
  signInAdminWithPassword,
  signInAdminWithOtp,
  signOutAdmin,
  updateBookingStatus,
  deleteBooking,
  createMix,
  deleteMix,
  createCategory,
  deleteCategory,
  saveSocialLink,
  deleteSocialLink,
  updateProfile
} from '../lib/supabase';

export default function AdminDashboard({
  profile,
  events = [],
  bookings = [],
  mixes = [],
  categories = [],
  socialLinks = [],
  onRefreshData,
  onClose
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Supabase Auth Integration
  const [adminUser, setAdminUser] = useState(null);
  const [loginTab, setLoginTab] = useState('passcode'); // 'passcode' | 'supabase'
  const [supabaseEmail, setSupabaseEmail] = useState('josephngotho988@gmail.com');
  const [supabasePassword, setSupabasePassword] = useState('');
  const [supabaseAuthLoading, setSupabaseAuthLoading] = useState(false);
  const [supabaseAuthFeedback, setSupabaseAuthFeedback] = useState({ type: '', message: '' });

  // Visible Message Delivery (Toast banner)
  const [toast, setToast] = useState(null);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(prev => (prev?.title === title ? null : prev));
    }, 6000);
  };

  const [activeTab, setActiveTab] = useState('overview');
  const [backendStatus, setBackendStatus] = useState({ checked: false, online: false });
  const [sqlCopied, setSqlCopied] = useState(false);

  // Events Form State
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventModal, setEventModal] = useState(false);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventSubmitError, setEventSubmitError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [flyerFile, setFlyerFile] = useState(null);
  const [flyerPreview, setFlyerPreview] = useState(null);

  const [eventFormData, setEventFormData] = useState({
    title: '',
    venue: '',
    city: 'Nairobi',
    event_date: '',
    event_time: '21:00 - LATE',
    description: '',
    flyer_path: '',
    flyer_url: '',
    ticket_url: '',
    category_id: null,
    category: 'Club Night',
    status: 'upcoming'
  });

  // Mixes Form
  const [mixModal, setMixModal] = useState(false);
  const [mixFormData, setMixFormData] = useState({
    title: '',
    genre: 'Afro-Urban',
    duration: '',
    audio_url: '',
    stream_url: '',
    artwork_url: '',
    tracklist: ''
  });

  // Category Form
  const [catModal, setCatModal] = useState(false);
  const [catFormData, setCatFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });

  // Profile Form
  const [profileForm, setProfileForm] = useState({ ...profile });
  const [profileSaved, setProfileSaved] = useState(false);

  // Social Links Form
  const [socialModal, setSocialModal] = useState(false);
  const [socialFormData, setSocialFormData] = useState({
    platform: 'instagram',
    url: '',
    handle: ''
  });

  useEffect(() => {
    checkBackend();
    checkAuthUser();
    if (localStorage.getItem('djsamizen_admin_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    setProfileForm({ ...profile });
  }, [profile]);

  const checkAuthUser = async () => {
    const user = await getCurrentUser();
    if (user) {
      setAdminUser(user);
      setIsAuthenticated(true);
    }
  };

  const checkBackend = async () => {
    const res = await checkBackendStatus();
    setBackendStatus({ checked: true, ...res });
  };

  const handlePasscodeLogin = (e) => {
    e.preventDefault();
    if (passcode === 'samizen2026' || passcode === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('djsamizen_admin_auth', 'true');
      setAuthError('');
      showToast('success', 'Unlocked Dashboard', 'Signed in via passcode.');
    } else {
      setAuthError('Incorrect passcode. Try again.');
    }
  };

  const handleSupabasePasswordLogin = async (e) => {
    e.preventDefault();
    setSupabaseAuthLoading(true);
    setSupabaseAuthFeedback({ type: '', message: '' });

    const { user, error } = await signInAdminWithPassword(supabaseEmail, supabasePassword);
    setSupabaseAuthLoading(false);

    if (error) {
      setSupabaseAuthFeedback({
        type: 'error',
        message: error.message || 'Authentication rejected by Supabase Auth.'
      });
    } else if (user) {
      setAdminUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('djsamizen_admin_auth', 'true');
      showToast('success', 'Authenticated with Supabase', `Signed in as ${user.email}`);
    }
  };

  const handleSupabaseOtpLogin = async (e) => {
    e.preventDefault();
    setSupabaseAuthLoading(true);
    setSupabaseAuthFeedback({ type: '', message: '' });

    const { error } = await signInAdminWithOtp(supabaseEmail);
    setSupabaseAuthLoading(false);

    if (error) {
      setSupabaseAuthFeedback({
        type: 'error',
        message: error.message || 'Could not send sign-in link.'
      });
    } else {
      setSupabaseAuthFeedback({
        type: 'success',
        message: `Magic link dispatched to ${supabaseEmail}. Check your email to sign in directly!`
      });
    }
  };

  const handleLogout = async () => {
    await signOutAdmin();
    setAdminUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('djsamizen_admin_auth');
    showToast('info', 'Logged Out', 'You have been signed out.');
  };

  // Event actions
  const handleOpenAddEvent = () => {
    setEditingEvent(null);
    setEventFormData({
      title: '',
      venue: '',
      city: 'Nairobi',
      event_date: '',
      event_time: '21:00 - LATE',
      description: '',
      flyer_path: '',
      flyer_url: '',
      ticket_url: '',
      category_id: categories[0]?.id || null,
      category: categories[0]?.name || 'Club Night',
      status: 'upcoming'
    });
    setFlyerFile(null);
    setFlyerPreview(null);
    setFieldErrors({});
    setEventSubmitError(null);
    setEventModal(true);
  };

  const handleOpenEditEvent = (evt) => {
    setEditingEvent(evt);
    setEventFormData({ ...evt });
    setFlyerFile(null);
    setFlyerPreview(evt.flyer_url || null);
    setFieldErrors({});
    setEventSubmitError(null);
    setEventModal(true);
  };

  const handleFlyerFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // MIME type check
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setFieldErrors(prev => ({ ...prev, flyer: 'Only JPEG, PNG, or WebP images are supported.' }));
      return;
    }

    // Size check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors(prev => ({
        ...prev,
        flyer: `File is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Limit is 5.00 MB.`
      }));
      return;
    }

    setFieldErrors(prev => {
      const copy = { ...prev };
      delete copy.flyer;
      return copy;
    });

    setFlyerFile(file);
    setFlyerPreview(URL.createObjectURL(file));
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setEventSubmitError(null);

    // 1. Client-side field validation
    const errors = {};
    if (!eventFormData.title?.trim()) {
      errors.title = 'Enter an event title.';
    }
    if (!eventFormData.event_date) {
      errors.event_date = 'Select a valid event date.';
    }
    // Flyer validation: if new event, must provide a file or an existing flyer URL
    if (!editingEvent && !flyerFile && !eventFormData.flyer_url?.trim()) {
      errors.flyer = 'Select a flyer image (JPEG, PNG, WebP up to 5MB).';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setEventSubmitting(true);

    let finalFlyerPath = eventFormData.flyer_path || '';
    let finalFlyerUrl = eventFormData.flyer_url || '';
    let newlyUploadedPath = null;

    // 2. Storage upload if a new flyer file was chosen
    if (flyerFile) {
      const uploadRes = await uploadFlyer(flyerFile, eventFormData.title);
      if (uploadRes.error) {
        setEventSubmitting(false);
        const err = uploadRes.error;
        const isRls = err.code === 'AccessDenied' || err.statusCode === 403 || err.status === 400;

        setEventSubmitError({
          heading: 'Flyer Upload Failed',
          operation: 'Storage Upload (event-flyers)',
          code: err.code || err.statusCode || 'StorageError',
          message: err.message || 'Storage rejected flyer upload.',
          suggestion: isRls
            ? 'Storage access was denied by RLS policy. To upload flyers directly, sign in with your authorized admin account (josephngotho988@gmail.com) via Supabase Auth.'
            : 'Check that the image is a valid JPEG, PNG, or WebP under 5MB.'
        });

        showToast('error', 'Flyer Upload Failed', err.message || 'Storage policy rejected upload.');
        // KEEP MODAL OPEN, PRESERVE INPUTS!
        return;
      }

      newlyUploadedPath = uploadRes.data.path;
      finalFlyerPath = uploadRes.data.path;
      finalFlyerUrl = uploadRes.data.publicUrl;
    }

    // 3. Database Insert or Update
    if (editingEvent) {
      const payload = {
        ...eventFormData,
        flyer_path: finalFlyerPath || eventFormData.flyer_path,
        flyer_url: finalFlyerUrl || eventFormData.flyer_url
      };

      const res = await updateEvent(editingEvent.id, payload);
      setEventSubmitting(false);

      if (res.error) {
        setEventSubmitError({
          heading: 'Could Not Update Event',
          operation: 'Database Update (public.events)',
          code: res.error.code || 'DB_ERROR',
          message: res.error.message || 'Database rejected event update.',
          details: res.error.details,
          hint: res.error.hint,
          suggestion: res.error.code === '42501'
            ? 'Row Level Security policy rejected this update. Authenticate with your authorized admin account (josephngotho988@gmail.com).'
            : 'Check that submitted values match table constraints.'
        });

        showToast('error', 'Could Not Update Event', res.error.message);
        // KEEP MODAL OPEN!
        return;
      }

      // Success
      setEventModal(false);
      setEditingEvent(null);
      showToast('success', 'Event Updated Successfully', `"${eventFormData.title}" has been saved.`);
      onRefreshData();
    } else {
      const payload = {
        ...eventFormData,
        flyer_path: finalFlyerPath || `manual/${Date.now()}`,
        flyer_url: finalFlyerUrl
      };

      const res = await createEvent(payload);
      setEventSubmitting(false);

      if (res.error) {
        // Rollback orphan uploaded flyer
        if (newlyUploadedPath) {
          await deleteFlyer(newlyUploadedPath);
        }

        setEventSubmitError({
          heading: 'Could Not Create Event',
          operation: 'Database Insert (public.events)',
          code: res.error.code || 'DB_ERROR',
          message: res.error.message || 'Database rejected event insertion.',
          details: res.error.details,
          hint: res.error.hint,
          suggestion: res.error.code === '42501'
            ? 'Row Level Security policy rejected this insert. Ensure you are signed in as authorized administrator (josephngotho988@gmail.com).'
            : res.error.code === '23502'
            ? `Required column missing: ${res.error.message}`
            : 'Review the technical error details below.'
        });

        showToast('error', 'Could Not Create Event', res.error.message);
        // KEEP MODAL OPEN, PRESERVE INPUTS!
        return;
      }

      // Success!
      setEventModal(false);
      setEditingEvent(null);
      setFlyerFile(null);
      setFlyerPreview(null);
      showToast('success', 'Event Created Successfully', `"${res.data.title}" is now published on the public tour dates.`);
      onRefreshData();
    }
  };

  const handleDeleteEvent = async (id, title = 'Event') => {
    if (window.confirm(`Delete "${title}"?`)) {
      const res = await deleteEvent(id);
      if (res.error) {
        showToast('error', 'Could Not Delete Event', res.error.message || 'Database error occurred.');
      } else {
        showToast('info', 'Event Deleted', 'The event has been removed from the database.');
        onRefreshData();
      }
    }
  };

  // Booking actions
  const handleUpdateBooking = async (id, status, notes) => {
    const res = await updateBookingStatus(id, status, notes);
    if (res.error) {
      showToast('error', 'Could Not Update Booking', res.error.message);
    } else {
      showToast('success', 'Booking Updated', `Status changed to ${status}`);
      onRefreshData();
    }
  };

  const handleDeleteBooking = async (id) => {
    if (window.confirm('Delete this booking inquiry record?')) {
      const res = await deleteBooking(id);
      if (res.error) {
        showToast('error', 'Could Not Delete Booking', res.error.message);
      } else {
        showToast('info', 'Booking Deleted', 'Record was removed.');
        onRefreshData();
      }
    }
  };

  const handleWhatsAppClient = (booking) => {
    const phone = booking.client_phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${booking.client_name}! This is the management team for DJ Samizen regarding your booking inquiry for ${booking.event_date}. We'd like to discuss the arrangements with you.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  // Mix actions
  const handleSaveMix = async (e) => {
    e.preventDefault();
    const res = await createMix(mixFormData);
    if (res.error) {
      showToast('error', 'Could Not Add Mix', res.error.message);
    } else {
      setMixModal(false);
      setMixFormData({
        title: '',
        genre: 'Afro-Urban',
        duration: '',
        audio_url: '',
        stream_url: '',
        artwork_url: '',
        tracklist: ''
      });
      showToast('success', 'Mix Added Successfully', `"${res.data.title}" added to audio vault.`);
      onRefreshData();
    }
  };

  const handleDeleteMix = async (id, title = 'Mix') => {
    if (window.confirm(`Delete "${title}"?`)) {
      const res = await deleteMix(id);
      if (res.error) {
        showToast('error', 'Could Not Delete Mix', res.error.message);
      } else {
        showToast('info', 'Mix Deleted', 'Mix removed from vault.');
        onRefreshData();
      }
    }
  };

  // Category actions
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const slug = catFormData.slug || catFormData.name.toLowerCase().replace(/\s+/g, '-');
    const res = await createCategory({ ...catFormData, slug });
    if (res.error) {
      showToast('error', 'Could Not Create Category', res.error.message);
    } else {
      setCatModal(false);
      setCatFormData({ name: '', slug: '', description: '' });
      showToast('success', 'Category Created', `"${res.data.name}" genre category added.`);
      onRefreshData();
    }
  };

  const handleDeleteCategory = async (id, name = 'Category') => {
    if (window.confirm(`Delete category "${name}"?`)) {
      const res = await deleteCategory(id);
      if (res.error) {
        showToast('error', 'Could Not Delete Category', res.error.message);
      } else {
        showToast('info', 'Category Deleted', 'Genre category removed.');
        onRefreshData();
      }
    }
  };

  // Social actions
  const handleSaveSocial = async (e) => {
    e.preventDefault();
    const res = await saveSocialLink(socialFormData);
    if (res.error) {
      showToast('error', 'Could Not Save Social Channel', res.error.message);
    } else {
      setSocialModal(false);
      setSocialFormData({ platform: 'instagram', url: '', handle: '' });
      showToast('success', 'Social Link Saved', `${socialFormData.platform.toUpperCase()} channel linked.`);
      onRefreshData();
    }
  };

  const handleDeleteSocial = async (id) => {
    if (window.confirm('Delete this social channel?')) {
      const res = await deleteSocialLink(id);
      if (res.error) {
        showToast('error', 'Could Not Delete Social Channel', res.error.message);
      } else {
        showToast('info', 'Social Channel Removed', 'Channel deleted.');
        onRefreshData();
      }
    }
  };

  // Profile save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const res = await updateProfile(profileForm);
    if (res.error) {
      showToast('error', 'Could Not Save Profile', res.error.message);
    } else {
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      showToast('success', 'Profile Saved Successfully', 'DJ Samizen brand information updated.');
      onRefreshData();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login-overlay">
        {/* Render Toast inside overlay */}
        {toast && (
          <div className="admin-toast-container">
            <div className={`admin-toast toast-${toast.type}`}>
              <div className="toast-icon">
                {toast.type === 'success' && <CheckCircle size={20} />}
                {toast.type === 'error' && <AlertTriangle size={20} />}
                {toast.type === 'info' && <Info size={20} />}
              </div>
              <div className="toast-content">
                <h4 className="toast-title">{toast.title}</h4>
                <p className="toast-message">{toast.message}</p>
              </div>
              <button onClick={() => setToast(null)} className="toast-close-btn" aria-label="Close Notification">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="admin-login-box">
          <div className="login-icon-hub">
            <Lock size={32} className="login-icon" />
          </div>
          <h2 className="login-title">DJ SAMIZEN DASHBOARD</h2>
          <p className="login-sub">Sign in to manage events, flyer storage, mixes, and bookings.</p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setLoginTab('passcode')}
              style={{
                flex: 1,
                padding: '0.5rem',
                backgroundColor: loginTab === 'passcode' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: loginTab === 'passcode' ? '#f59e0b' : '#a1a1aa',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Passcode Unlock
            </button>
            <button
              type="button"
              onClick={() => setLoginTab('supabase')}
              style={{
                flex: 1,
                padding: '0.5rem',
                backgroundColor: loginTab === 'supabase' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: loginTab === 'supabase' ? '#f59e0b' : '#a1a1aa',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Supabase Auth (Admin)
            </button>
          </div>

          {loginTab === 'passcode' ? (
            <form onSubmit={handlePasscodeLogin} className="login-form">
              <input
                type="password"
                placeholder="Passcode (Default: samizen2026)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="passcode-input"
                autoFocus
              />

              {authError && <p className="auth-error-msg">{authError}</p>}

              <button type="submit" className="btn btn-primary btn-full">
                <span>Unlock Admin Panel</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleSupabasePasswordLogin} className="login-form">
              <div style={{ marginBottom: '0.75rem', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: '#a1a1aa', display: 'block', marginBottom: '0.25rem' }}>Administrator Email</label>
                <input
                  type="email"
                  value={supabaseEmail}
                  onChange={(e) => setSupabaseEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', backgroundColor: '#0d0d12', border: '1px solid #26262e', color: '#fff', borderRadius: '6px' }}
                />
              </div>
              <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                <label style={{ fontSize: '0.8rem', color: '#a1a1aa', display: 'block', marginBottom: '0.25rem' }}>Password</label>
                <input
                  type="password"
                  placeholder="Enter Supabase account password"
                  value={supabasePassword}
                  onChange={(e) => setSupabasePassword(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', backgroundColor: '#0d0d12', border: '1px solid #26262e', color: '#fff', borderRadius: '6px' }}
                />
              </div>

              {supabaseAuthFeedback.message && (
                <p style={{
                  color: supabaseAuthFeedback.type === 'error' ? '#ef4444' : '#10b981',
                  fontSize: '0.82rem',
                  marginBottom: '1rem',
                  textAlign: 'left'
                }}>
                  {supabaseAuthFeedback.message}
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <button
                  type="submit"
                  disabled={supabaseAuthLoading}
                  className="btn btn-primary btn-full"
                >
                  <span>{supabaseAuthLoading ? 'Signing in...' : 'Sign In with Password'}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={handleSupabaseOtpLogin}
                disabled={supabaseAuthLoading}
                className="btn btn-secondary btn-full"
                style={{ fontSize: '0.82rem' }}
              >
                <span>Send Magic Sign-In Link</span>
              </button>
            </form>
          )}

          <button onClick={onClose} className="btn btn-outline btn-full back-site-btn">
            <span>Return to Public Site</span>
          </button>
        </div>
      </div>
    );
  }

  const upcomingCount = events.filter(e => e.status === 'upcoming').length;
  const newBookingsCount = bookings.filter(b => b.status === 'new').length;

  return (
    <div className="admin-dashboard-wrapper">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="admin-toast-container">
          <div className={`admin-toast toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'success' && <CheckCircle size={20} />}
              {toast.type === 'error' && <AlertTriangle size={20} />}
              {toast.type === 'info' && <Info size={20} />}
            </div>
            <div className="toast-content">
              <h4 className="toast-title">{toast.title}</h4>
              <p className="toast-message">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="toast-close-btn" aria-label="Close Notification">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Top Bar */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-brand-tag">
            <span>{profile.dj_name || 'DJ SAMIZEN'}</span>
            <span className="admin-badge">ADMIN</span>
          </div>
        </div>

        <div className="admin-header-right">
          {adminUser ? (
            <div className="auth-badge-connected" title={`Authenticated with Supabase as ${adminUser.email}`}>
              <ShieldCheck size={16} />
              <span>{adminUser.email.split('@')[0]} (Admin)</span>
            </div>
          ) : (
            <div className="auth-badge-anon" title="Signed in with passcode only. Authenticate with Supabase Auth for full storage upload permissions.">
              <Lock size={14} />
              <span>Passcode Session</span>
            </div>
          )}

          <div className={`status-indicator ${backendStatus.online ? 'status-online' : 'status-fallback'}`}>
            <span className="status-dot"></span>
            <span>{backendStatus.online ? 'Supabase Connected' : 'Local Storage Mode'}</span>
          </div>

          <button onClick={onRefreshData} className="admin-icon-btn" title="Refresh Data">
            <RefreshCw size={16} />
          </button>

          <button onClick={handleLogout} className="admin-icon-btn" title="Logout">
            <LogOut size={16} />
          </button>

          <button onClick={onClose} className="btn btn-secondary btn-sm">
            <span>Exit Dashboard</span>
          </button>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="admin-body-grid">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          <nav className="admin-nav-tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            >
              <Database size={18} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`admin-tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            >
              <Send size={18} />
              <span>Inquiries</span>
              <span className="tab-count-badge">{bookings.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className={`admin-tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            >
              <Calendar size={18} />
              <span>Events</span>
              <span className="tab-count-badge">{events.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('mixes')}
              className={`admin-tab-btn ${activeTab === 'mixes' ? 'active' : ''}`}
            >
              <Radio size={18} />
              <span>Mixes</span>
              <span className="tab-count-badge">{mixes.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`admin-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
            >
              <Tag size={18} />
              <span>Categories / Genres</span>
              <span className="tab-count-badge">{categories.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('socials')}
              className={`admin-tab-btn ${activeTab === 'socials' ? 'active' : ''}`}
            >
              <Share2 size={18} />
              <span>Social Links</span>
              <span className="tab-count-badge">{socialLinks.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`admin-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            >
              <User size={18} />
              <span>Profile & Contacts</span>
            </button>

            <button
              onClick={() => setActiveTab('database')}
              className={`admin-tab-btn ${activeTab === 'database' ? 'active' : ''}`}
            >
              <Database size={18} />
              <span>Database Setup</span>
              {!backendStatus.online && <span className="tab-alert-badge">!</span>}
            </button>
          </nav>
        </aside>

        {/* Main Panel */}
        <main className="admin-main-panel">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="admin-tab-content">
              <div className="tab-header-row">
                <div>
                  <h2 className="tab-main-title">Management Overview</h2>
                  <p className="tab-main-sub">Real-time statistics driven entirely by your actual records.</p>
                </div>
              </div>

              {/* Real counters - Zero fabrication */}
              <div className="admin-metrics-row">
                <div className="admin-stat-card">
                  <span className="stat-label">Upcoming Events</span>
                  <span className="stat-value">{upcomingCount}</span>
                  <span className="stat-sub">Active public dates</span>
                </div>
                <div className="admin-stat-card">
                  <span className="stat-label">Booking Inquiries</span>
                  <span className="stat-value">{bookings.length}</span>
                  <span className="stat-sub">{newBookingsCount} awaiting response</span>
                </div>
                <div className="admin-stat-card">
                  <span className="stat-label">Published Mixes</span>
                  <span className="stat-value">{mixes.length}</span>
                  <span className="stat-sub">Audio sets in vault</span>
                </div>
                <div className="admin-stat-card">
                  <span className="stat-label">Sound Categories</span>
                  <span className="stat-value">{categories.length}</span>
                  <span className="stat-sub">Curated genres</span>
                </div>
              </div>

              <div className="admin-quick-actions-card">
                <h3>Quick Management Actions</h3>
                <div className="quick-actions-grid">
                  <button onClick={() => { setActiveTab('events'); setEditingEvent(null); setEventModal(true); }} className="btn btn-secondary">
                    <Plus size={16} />
                    <span>Post New Event</span>
                  </button>
                  <button onClick={() => { setActiveTab('mixes'); setMixModal(true); }} className="btn btn-secondary">
                    <Plus size={16} />
                    <span>Upload Mix Details</span>
                  </button>
                  <button onClick={() => setActiveTab('bookings')} className="btn btn-secondary">
                    <Send size={16} />
                    <span>Review Inquiries</span>
                  </button>
                  <button onClick={() => setActiveTab('profile')} className="btn btn-secondary">
                    <User size={16} />
                    <span>Edit Profile & Phone</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: BOOKINGS */}
          {activeTab === 'bookings' && (
            <div className="admin-tab-content">
              <div className="tab-header-row">
                <div>
                  <h2 className="tab-main-title">Client Booking Inquiries</h2>
                  <p className="tab-main-sub">Submissions received via the website inquiry form.</p>
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Organizer / Client</th>
                      <th>Event Details</th>
                      <th>Preferences</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty-table-cell">
                          No booking inquiries logged yet. When clients submit the booking form, inquiries will appear here.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((bk) => (
                        <tr key={bk.id}>
                          <td>
                            <strong>{bk.client_name}</strong>
                            <div className="cell-sub">{bk.client_phone}</div>
                            {bk.client_email && <div className="cell-sub">{bk.client_email}</div>}
                          </td>
                          <td>
                            <div className="cell-primary">{bk.event_type}</div>
                            <div className="cell-meta">Date: {bk.event_date}</div>
                            <div className="cell-meta">Location: {bk.event_location}</div>
                          </td>
                          <td>
                            <div className="cell-notes">{bk.music_preferences || 'None specified'}</div>
                          </td>
                          <td>
                            <select
                              value={bk.status || 'new'}
                              onChange={(e) => handleUpdateBooking(bk.id, e.target.value)}
                              className={`status-select status-${bk.status || 'new'}`}
                            >
                              <option value="new">New</option>
                              <option value="in_discussion">In Discussion</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="completed">Completed</option>
                              <option value="declined">Declined</option>
                            </select>
                          </td>
                          <td>
                            <div className="table-actions-cell">
                              {bk.client_phone && (
                                <button
                                  onClick={() => handleWhatsAppClient(bk)}
                                  className="action-btn-whatsapp"
                                  title="Reply on WhatsApp"
                                >
                                  <MessageSquare size={16} />
                                  <span>WhatsApp</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteBooking(bk.id)}
                                className="action-btn-delete"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: EVENTS */}
          {activeTab === 'events' && (
            <div className="admin-tab-content">
              <div className="tab-header-row">
                <div>
                  <h2 className="tab-main-title">Events & Gigs Manager</h2>
                  <p className="tab-main-sub">Add and maintain real tour dates and club appearances.</p>
                </div>
                <button
                  onClick={handleOpenAddEvent}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={16} />
                  <span>Add Event</span>
                </button>
              </div>

              {events.length === 0 ? (
                <div className="empty-state-card">
                  <p>No events in database. Click "Add Event" to post an upcoming performance.</p>
                </div>
              ) : (
                <div className="admin-events-grid">
                  {events.map((evt) => (
                    <div key={evt.id} className="admin-event-card">
                      {evt.flyer_url && (
                        <div className="admin-evt-thumb">
                          <img src={evt.flyer_url} alt={evt.title} />
                        </div>
                      )}
                      <div className="admin-evt-info">
                        <div className="admin-evt-tags">
                          {evt.category && <span className="badge badge-tag">{evt.category}</span>}
                          <span className={`badge ${evt.status === 'upcoming' ? 'badge-live' : 'badge-tag'}`}>
                            {evt.status.toUpperCase()}
                          </span>
                        </div>
                        <h3>{evt.title}</h3>
                        <p className="admin-evt-venue">{evt.venue} — {evt.city}</p>
                        <p className="admin-evt-date">Date: {evt.event_date} ({evt.event_time})</p>
                      </div>
                      <div className="admin-evt-actions">
                        <button
                          onClick={() => handleOpenEditEvent(evt)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(evt.id, evt.title)}
                          className="btn btn-outline btn-sm delete-btn"
                          title="Delete Event"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: MIXES */}
          {activeTab === 'mixes' && (
            <div className="admin-tab-content">
              <div className="tab-header-row">
                <div>
                  <h2 className="tab-main-title">Mixes & Audio Vault</h2>
                  <p className="tab-main-sub">Manage mixes and sound streams available on the public player.</p>
                </div>
                <button onClick={() => setMixModal(true)} className="btn btn-primary btn-sm">
                  <Plus size={16} />
                  <span>Add Mix</span>
                </button>
              </div>

              {mixes.length === 0 ? (
                <div className="empty-state-card">
                  <p>No mixes currently added. Click "Add Mix" to link an MP3 or streaming set.</p>
                </div>
              ) : (
                <div className="admin-mixes-list">
                  {mixes.map((mix) => (
                    <div key={mix.id} className="admin-mix-row">
                      <div className="admin-mix-details">
                        <h4>{mix.title}</h4>
                        <p>{mix.genre} {mix.duration ? `• ${mix.duration}` : ''}</p>
                        {mix.audio_url && <span className="cell-meta">Audio: {mix.audio_url}</span>}
                        {mix.stream_url && <span className="cell-meta">Stream: {mix.stream_url}</span>}
                      </div>
                      <button onClick={() => handleDeleteMix(mix.id)} className="btn btn-outline btn-sm delete-btn">
                        <Trash2 size={14} />
                        <span>Delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="admin-tab-content">
              <div className="tab-header-row">
                <div>
                  <h2 className="tab-main-title">Event Categories & Genres</h2>
                  <p className="tab-main-sub">Categories used to tag events and define the musical palette.</p>
                </div>
                <button onClick={() => setCatModal(true)} className="btn btn-primary btn-sm">
                  <Plus size={16} />
                  <span>Add Category</span>
                </button>
              </div>

              <div className="admin-categories-grid">
                {categories.map((cat) => (
                  <div key={cat.id || cat.slug} className="admin-cat-card">
                    <div>
                      <h4>{cat.name}</h4>
                      <p className="cell-sub">{cat.description || 'No description'}</p>
                    </div>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="action-btn-delete">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SOCIAL LINKS */}
          {activeTab === 'socials' && (
            <div className="admin-tab-content">
              <div className="tab-header-row">
                <div>
                  <h2 className="tab-main-title">Official Social Links</h2>
                  <p className="tab-main-sub">Add only legitimate social profiles (Instagram, TikTok, YouTube, SoundCloud, Mixcloud).</p>
                </div>
                <button onClick={() => setSocialModal(true)} className="btn btn-primary btn-sm">
                  <Plus size={16} />
                  <span>Add Channel</span>
                </button>
              </div>

              {socialLinks.length === 0 ? (
                <div className="empty-state-card">
                  <p>No social links configured yet. Add your official accounts to display them in the website footer.</p>
                </div>
              ) : (
                <div className="admin-socials-list">
                  {socialLinks.map((soc) => (
                    <div key={soc.id || soc.platform} className="admin-social-row">
                      <div className="admin-social-info">
                        <strong>{soc.platform.toUpperCase()}</strong>
                        <span className="cell-sub">{soc.url}</span>
                        {soc.handle && <span className="cell-meta">({soc.handle})</span>}
                      </div>
                      <button onClick={() => handleDeleteSocial(soc.id)} className="action-btn-delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <div className="admin-tab-content">
              <div className="tab-header-row">
                <div>
                  <h2 className="tab-main-title">DJ Profile & Contact Information</h2>
                  <p className="tab-main-sub">Update artist bio, contact channels, and stage location.</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="admin-profile-form">
                {profileSaved && (
                  <div className="save-success-banner">
                    <CheckCircle size={18} />
                    <span>Profile settings saved successfully!</span>
                  </div>
                )}

                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Stage Name</label>
                    <input
                      type="text"
                      value={profileForm.dj_name || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, dj_name: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Brand Tagline</label>
                    <input
                      type="text"
                      value={profileForm.tagline || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label>WhatsApp Number (e.g. +254 7...)</label>
                    <input
                      type="text"
                      placeholder="Leave blank if unconfigured"
                      value={profileForm.booking_whatsapp || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, booking_whatsapp: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>Booking Phone Number</label>
                    <input
                      type="text"
                      placeholder="Leave blank if unconfigured"
                      value={profileForm.booking_phone || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, booking_phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-field">
                    <label>Booking Email Address</label>
                    <input
                      type="email"
                      placeholder="Leave blank if unconfigured"
                      value={profileForm.booking_email || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, booking_email: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label>City / Location</label>
                    <input
                      type="text"
                      value={profileForm.location || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label>Club Residency (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Westlands, Nairobi"
                    value={profileForm.residency || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, residency: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>DJ Portrait Image URL (Leave blank to use minimalist graphic fallback)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={profileForm.hero_image_url || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, hero_image_url: e.target.value })}
                  />
                </div>

                <div className="form-field">
                  <label>Artist Bio</label>
                  <textarea
                    rows="5"
                    value={profileForm.bio || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary">
                  <span>Save Profile</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB: DATABASE SETUP */}
          {activeTab === 'database' && (
            <div className="admin-tab-content">
              <div className="tab-header-row">
                <div>
                  <h2 className="tab-main-title">Supabase Database Connection</h2>
                  <p className="tab-main-sub">Verify connection to project `mkjzswvnrqvnedqdgukg`.</p>
                </div>
              </div>

              <div className="database-status-card">
                <div className="db-status-header">
                  {backendStatus.online ? (
                    <div className="db-badge-online">
                      <CheckCircle size={20} />
                      <span>Supabase Project Connected!</span>
                    </div>
                  ) : (
                    <div className="db-badge-fallback">
                      <AlertTriangle size={20} />
                      <span>Database Tables Pending in Supabase SQL Editor</span>
                    </div>
                  )}
                  <button onClick={checkBackend} className="btn btn-secondary btn-sm">
                    <RefreshCw size={14} />
                    <span>Re-check Connection</span>
                  </button>
                </div>

                <div className="migration-instructions-box">
                  <h3>Run SQL Schema:</h3>
                  <ol className="step-list">
                    <li>Open your Supabase project: <a href="https://supabase.com/dashboard/project/mkjzswvnrqvnedqdgukg/sql/new" target="_blank" rel="noreferrer" className="supabase-link">Open Supabase SQL Editor <ExternalLink size={14} /></a></li>
                    <li>Copy the clean production schema below and paste it into the editor.</li>
                    <li>Click <strong>Run</strong> in Supabase.</li>
                    <li>Click "Re-check Connection" above to verify.</li>
                  </ol>

                  <button
                    onClick={() => {
                      fetch('/supabase/schema.sql')
                        .then(r => r.text())
                        .then(text => {
                          navigator.clipboard.writeText(text);
                          setSqlCopied(true);
                          setTimeout(() => setSqlCopied(false), 3000);
                        })
                        .catch(() => {
                          navigator.clipboard.writeText('-- Run schema.sql from supabase/schema.sql');
                          setSqlCopied(true);
                          setTimeout(() => setSqlCopied(false), 3000);
                        });
                    }}
                    className="btn btn-primary"
                  >
                    <Copy size={16} />
                    <span>{sqlCopied ? 'Schema Copied to Clipboard!' : 'Copy schema.sql'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* EVENT MODAL */}
      {eventModal && (
        <div className="modal-backdrop" onClick={() => !eventSubmitting && setEventModal(false)}>
          <div className="modal-form-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-form-header">
              <h3>{editingEvent ? 'Edit Event' : 'Add New Event'}</h3>
              <button
                type="button"
                disabled={eventSubmitting}
                onClick={() => setEventModal(false)}
                className="modal-close-btn"
                aria-label="Close Modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Submission Error Panel */}
            {eventSubmitError && (
              <div className="modal-error-panel" role="alert">
                <div className="error-panel-header">
                  <AlertTriangle size={20} />
                  <span className="error-panel-heading">{eventSubmitError.heading || 'Submission Failed'}</span>
                  {eventSubmitError.operation && (
                    <span className="error-panel-op-badge">{eventSubmitError.operation}</span>
                  )}
                </div>

                <p className="error-panel-desc">{eventSubmitError.message}</p>

                {(eventSubmitError.code || eventSubmitError.details || eventSubmitError.hint) && (
                  <div className="error-panel-tech-box">
                    <div className="error-panel-tech-meta">
                      {eventSubmitError.code && (
                        <span>Supabase Error Code: <strong>{eventSubmitError.code}</strong></span>
                      )}
                    </div>
                    {eventSubmitError.details && <div>Details: {eventSubmitError.details}</div>}
                    {eventSubmitError.hint && <div>Hint: {eventSubmitError.hint}</div>}
                  </div>
                )}

                {eventSubmitError.suggestion && (
                  <div className="error-panel-suggestion">
                    <Info size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{eventSubmitError.suggestion}</span>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="modal-actual-form">
              {/* Event Title */}
              <div className="form-field">
                <label>Event Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Westlands Afro-Urban Night"
                  value={eventFormData.title}
                  className={fieldErrors.title ? 'input-has-error' : ''}
                  onChange={(e) => {
                    setEventFormData({ ...eventFormData, title: e.target.value });
                    if (fieldErrors.title) {
                      setFieldErrors({ ...fieldErrors, title: null });
                    }
                  }}
                />
                {fieldErrors.title && (
                  <span className="field-error-text">
                    <AlertTriangle size={13} /> {fieldErrors.title}
                  </span>
                )}
              </div>

              {/* Venue and City */}
              <div className="form-grid-2">
                <div className="form-field">
                  <label>Venue Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Alchemist Bar"
                    value={eventFormData.venue}
                    className={fieldErrors.venue ? 'input-has-error' : ''}
                    onChange={(e) => {
                      setEventFormData({ ...eventFormData, venue: e.target.value });
                      if (fieldErrors.venue) {
                        setFieldErrors({ ...fieldErrors, venue: null });
                      }
                    }}
                  />
                  {fieldErrors.venue && (
                    <span className="field-error-text">
                      <AlertTriangle size={13} /> {fieldErrors.venue}
                    </span>
                  )}
                </div>
                <div className="form-field">
                  <label>City *</label>
                  <input
                    type="text"
                    placeholder="Nairobi"
                    value={eventFormData.city}
                    onChange={(e) => setEventFormData({ ...eventFormData, city: e.target.value })}
                  />
                </div>
              </div>

              {/* Date and Time */}
              <div className="form-grid-2">
                <div className="form-field">
                  <label>Event Date *</label>
                  <input
                    type="date"
                    value={eventFormData.event_date}
                    className={fieldErrors.event_date ? 'input-has-error' : ''}
                    onChange={(e) => {
                      setEventFormData({ ...eventFormData, event_date: e.target.value });
                      if (fieldErrors.event_date) {
                        setFieldErrors({ ...fieldErrors, event_date: null });
                      }
                    }}
                  />
                  {fieldErrors.event_date && (
                    <span className="field-error-text">
                      <AlertTriangle size={13} /> {fieldErrors.event_date}
                    </span>
                  )}
                </div>
                <div className="form-field">
                  <label>Event Time</label>
                  <input
                    type="text"
                    placeholder="21:00 - LATE"
                    value={eventFormData.event_time}
                    onChange={(e) => setEventFormData({ ...eventFormData, event_time: e.target.value })}
                  />
                </div>
              </div>

              {/* Category and Status */}
              <div className="form-grid-2">
                <div className="form-field">
                  <label>Genre / Category</label>
                  <select
                    value={eventFormData.category_id || eventFormData.category || ''}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const matched = categories.find(c => c.id === selectedVal || c.name === selectedVal);
                      setEventFormData({
                        ...eventFormData,
                        category_id: matched?.id || null,
                        category: matched?.name || selectedVal
                      });
                    }}
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map((c) => (
                      <option key={c.id || c.slug} value={c.id}>{c.name}</option>
                    ))}
                    <option value="Club Night">Club Night</option>
                    <option value="Festival">Festival</option>
                    <option value="Private Event">Private Event</option>
                  </select>
                </div>
                <div className="form-field">
                  <label>Status</label>
                  <select
                    value={eventFormData.status}
                    onChange={(e) => setEventFormData({ ...eventFormData, status: e.target.value })}
                  >
                    <option value="upcoming">Upcoming (Confirmed)</option>
                    <option value="past">Past</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
              </div>

              {/* Official Flyer Image Upload (Storage Bucket: event-flyers) */}
              <div className="form-field">
                <label>Official Event Flyer (Storage Upload) *</label>
                <div className={`flyer-upload-zone ${fieldErrors.flyer ? 'zone-has-error' : ''}`}>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFlyerFileChange}
                    disabled={eventSubmitting}
                  />
                  <div className="upload-zone-prompt">
                    <UploadCloud size={28} className="upload-icon" />
                    <span className="upload-prompt-title">
                      {flyerFile ? 'Click to select a different image' : 'Click or drop flyer image here'}
                    </span>
                    <span className="upload-prompt-sub">JPEG, PNG, or WebP up to 5 MB</span>
                  </div>
                </div>

                {fieldErrors.flyer && (
                  <span className="field-error-text">
                    <AlertTriangle size={13} /> {fieldErrors.flyer}
                  </span>
                )}

                {/* Selected Image Preview */}
                {(flyerPreview || eventFormData.flyer_url) && (
                  <div className="flyer-preview-card">
                    <img
                      src={flyerPreview || eventFormData.flyer_url}
                      alt="Flyer Preview"
                      className="flyer-preview-thumb"
                    />
                    <div className="flyer-preview-details">
                      <div className="flyer-preview-name">
                        {flyerFile ? flyerFile.name : (editingEvent ? 'Current Event Flyer' : 'Linked Flyer')}
                      </div>
                      <div className="flyer-preview-meta">
                        {flyerFile ? `${(flyerFile.size / (1024 * 1024)).toFixed(2)} MB` : 'URL / Storage Linked'}
                      </div>
                    </div>
                    {flyerFile && (
                      <button
                        type="button"
                        onClick={() => {
                          setFlyerFile(null);
                          setFlyerPreview(null);
                        }}
                        className="flyer-remove-btn"
                        title="Remove selected file"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Fallback Flyer URL */}
              <div className="form-field">
                <label>Or Flyer Public URL (Optional alternative)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={eventFormData.flyer_url || ''}
                  onChange={(e) => setEventFormData({ ...eventFormData, flyer_url: e.target.value })}
                />
              </div>

              {/* Ticket URL */}
              <div className="form-field">
                <label>Ticket / RSVP URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={eventFormData.ticket_url || ''}
                  onChange={(e) => setEventFormData({ ...eventFormData, ticket_url: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="form-field">
                <label>Description & Lineup (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Event details, dress code, supporting DJs..."
                  value={eventFormData.description || ''}
                  onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                ></textarea>
              </div>

              {/* Modal Actions */}
              <div className="modal-form-actions">
                <button
                  type="submit"
                  disabled={eventSubmitting}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {eventSubmitting ? (
                    <>
                      <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Saving Event...</span>
                    </>
                  ) : (
                    <span>{editingEvent ? 'Save Changes' : 'Create Event'}</span>
                  )}
                </button>
                <button
                  type="button"
                  disabled={eventSubmitting}
                  onClick={() => setEventModal(false)}
                  className="btn btn-secondary"
                >
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MIX MODAL */}
      {mixModal && (
        <div className="modal-backdrop" onClick={() => setMixModal(false)}>
          <div className="modal-form-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-form-header">
              <h3>Add Real Mix</h3>
              <button onClick={() => setMixModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveMix} className="modal-actual-form">
              <div className="form-field">
                <label>Mix Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Live at Westlands"
                  value={mixFormData.title}
                  onChange={(e) => setMixFormData({ ...mixFormData, title: e.target.value })}
                />
              </div>
              <div className="form-grid-2">
                <div className="form-field">
                  <label>Genre / Style</label>
                  <input
                    type="text"
                    placeholder="Afrobeats & Amapiano"
                    value={mixFormData.genre}
                    onChange={(e) => setMixFormData({ ...mixFormData, genre: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 45:00"
                    value={mixFormData.duration}
                    onChange={(e) => setMixFormData({ ...mixFormData, duration: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-field">
                <label>Direct Audio MP3 URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={mixFormData.audio_url}
                  onChange={(e) => setMixFormData({ ...mixFormData, audio_url: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>SoundCloud / Streaming URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://soundcloud.com/..."
                  value={mixFormData.stream_url}
                  onChange={(e) => setMixFormData({ ...mixFormData, stream_url: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Artwork Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={mixFormData.artwork_url}
                  onChange={(e) => setMixFormData({ ...mixFormData, artwork_url: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Tracklist (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Track sequence"
                  value={mixFormData.tracklist}
                  onChange={(e) => setMixFormData({ ...mixFormData, tracklist: e.target.value })}
                ></textarea>
              </div>
              <div className="modal-form-actions">
                <button type="submit" className="btn btn-primary">
                  <span>Save Mix</span>
                </button>
                <button type="button" onClick={() => setMixModal(false)} className="btn btn-secondary">
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CATEGORY MODAL */}
      {catModal && (
        <div className="modal-backdrop" onClick={() => setCatModal(false)}>
          <div className="modal-form-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-form-header">
              <h3>Add Sound Category</h3>
              <button onClick={() => setCatModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCategory} className="modal-actual-form">
              <div className="form-field">
                <label>Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Afrobeats"
                  value={catFormData.name}
                  onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Description</label>
                <input
                  type="text"
                  placeholder="Brief description of the sound"
                  value={catFormData.description}
                  onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                />
              </div>
              <div className="modal-form-actions">
                <button type="submit" className="btn btn-primary">
                  <span>Add Category</span>
                </button>
                <button type="button" onClick={() => setCatModal(false)} className="btn btn-secondary">
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SOCIAL MODAL */}
      {socialModal && (
        <div className="modal-backdrop" onClick={() => setSocialModal(false)}>
          <div className="modal-form-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-form-header">
              <h3>Add Social Profile</h3>
              <button onClick={() => setSocialModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveSocial} className="modal-actual-form">
              <div className="form-field">
                <label>Platform *</label>
                <select
                  value={socialFormData.platform}
                  onChange={(e) => setSocialFormData({ ...socialFormData, platform: e.target.value })}
                >
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                  <option value="youtube">YouTube</option>
                  <option value="soundcloud">SoundCloud</option>
                </select>
              </div>
              <div className="form-field">
                <label>Profile URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={socialFormData.url}
                  onChange={(e) => setSocialFormData({ ...socialFormData, url: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label>Handle / Username (Optional)</label>
                <input
                  type="text"
                  placeholder="@handle"
                  value={socialFormData.handle}
                  onChange={(e) => setSocialFormData({ ...socialFormData, handle: e.target.value })}
                />
              </div>
              <div className="modal-form-actions">
                <button type="submit" className="btn btn-primary">
                  <span>Save Channel</span>
                </button>
                <button type="button" onClick={() => setSocialModal(false)} className="btn btn-secondary">
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
