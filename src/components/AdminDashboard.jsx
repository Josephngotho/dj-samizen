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
  Share2,
  X,
  UploadCloud,
  Info,
  ShieldCheck,
  Check,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';

import {
  supabase,
  checkBackendStatus,
  createEvent,
  updateEvent,
  deleteEvent,
  uploadFlyer,
  getCurrentUser,
  getUserRole,
  signInAdminWithPassword,
  requestPasswordReset,
  signOutAdmin,
  updateBookingStatus,
  deleteBooking,
  createMix,
  updateMix,
  deleteMix,
  isValidYouTubeUrl,
  extractYouTubeId,
  saveSocialLink,
  updateProfile,
  getTeamMembers,
  addTeamMember,
  updateTeamMemberStatus,
  deleteTeamMember
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
  // Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'owner' | 'dj' | 'unauthorized' | null

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('josephngotho988@gmail.com');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [resetModal, setResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' });

  // Dashboard Nav & Feedback
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [backendStatus, setBackendStatus] = useState({ checked: false, online: false });
  const [sqlCopied, setSqlCopied] = useState(false);

  // Team Members (Owner Only)
  const [teamMembers, setTeamMembers] = useState([]);
  const [newDJEmail, setNewDJEmail] = useState('');
  const [newDJName, setNewDJName] = useState('');
  const [addingDJ, setAddingDJ] = useState(false);

  // Social Links Local Drafts
  const [socialDrafts, setSocialDrafts] = useState({
    facebook: '',
    youtube: '',
    tiktok: '',
    instagram: '',
    x: ''
  });
  const [socialSaving, setSocialSaving] = useState({});

  // Event Modal & Form State
  const [eventModal, setEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
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

  // Mix Modal & Form State (YouTube External Only)
  const [mixModal, setMixModal] = useState(false);
  const [editingMix, setEditingMix] = useState(null);
  const [mixSubmitting, setMixSubmitting] = useState(false);
  const [mixSubmitError, setMixSubmitError] = useState('');
  const [mixFormData, setMixFormData] = useState({
    title: '',
    genre: 'Afro-Urban',
    youtube_url: '',
    artwork_url: '',
    duration: 'Live Set'
  });

  // Profile Form
  const [profileForm, setProfileForm] = useState({ ...profile });
  const [profileSaving, setProfileSaving] = useState(false);

  const showToast = (type, title, message) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast((prev) => (prev?.title === title ? null : prev));
    }, 6000);
  };

  // Check auth session and user role
  const checkSession = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
        const role = await getUserRole(user);
        setUserRole(role);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
    } catch {
      setCurrentUser(null);
      setUserRole(null);
    }
  };

  const loadTeam = async () => {
    const list = await getTeamMembers();
    setTeamMembers(list);
  };

  const checkBackend = async () => {
    const res = await checkBackendStatus();
    setBackendStatus({ checked: true, ...res });
  };

  useEffect(() => {
    checkSession();
    checkBackend();

    // Listen to Supabase Auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
        const role = await getUserRole(session.user);
        setUserRole(role);
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setProfileForm({ ...profile });
  }, [profile]);

  useEffect(() => {
    // Populate social drafts from database
    const drafts = { facebook: '', youtube: '', tiktok: '', instagram: '', x: '' };
    socialLinks.forEach((s) => {
      if (s.platform && s.url) {
        drafts[s.platform.toLowerCase()] = s.url;
      }
    });
    setSocialDrafts(drafts);
  }, [socialLinks]);

  useEffect(() => {
    if (userRole === 'owner') {
      loadTeam();
    }
  }, [userRole]);

  // ----------------- AUTHENTICATION HANDLERS -----------------
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both email and password.');
      return;
    }

    setLoginLoading(true);
    setLoginError('');

    const { user, error } = await signInAdminWithPassword(loginEmail, loginPassword);
    setLoginLoading(false);

    if (error) {
      setLoginError(error.message || 'Invalid login credentials. Please check your password.');
      return;
    }

    if (user) {
      setCurrentUser(user);
      const role = await getUserRole(user);
      setUserRole(role);
      showToast('success', 'Signed In', `Authenticated as ${user.email} (${role.toUpperCase()})`);
      onRefreshData();
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setResetMessage({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }

    setResetLoading(true);
    setResetMessage({ type: '', text: '' });

    const { error } = await requestPasswordReset(resetEmail);
    setResetLoading(false);

    if (error) {
      setResetMessage({
        type: 'error',
        text: error.message || 'Could not send reset link. Rate limit or invalid email.'
      });
    } else {
      setResetMessage({
        type: 'success',
        text: `Password reset instructions sent to ${resetEmail}. Check your inbox!`
      });
    }
  };

  const handleLogout = async () => {
    await signOutAdmin();
    setCurrentUser(null);
    setUserRole(null);
    showToast('info', 'Signed Out', 'You have been signed out from the portal.');
  };

  // ----------------- EVENT ACTIONS -----------------
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
    setEventFormData({
      title: evt.title || '',
      venue: evt.venue || '',
      city: evt.city || 'Nairobi',
      event_date: evt.event_date || '',
      event_time: evt.event_time || '21:00 - LATE',
      description: evt.description || '',
      flyer_path: evt.flyer_path || '',
      flyer_url: evt.flyer_url || '',
      ticket_url: evt.ticket_url || '',
      category_id: evt.category_id || null,
      category: evt.category || 'Club Night',
      status: evt.status || 'upcoming'
    });
    setFlyerFile(null);
    setFlyerPreview(evt.flyer_url || null);
    setFieldErrors({});
    setEventSubmitError(null);
    setEventModal(true);
  };

  const handleFlyerFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFieldErrors((prev) => ({ ...prev, flyer: 'Please upload a JPEG, PNG, or WebP image.' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, flyer: 'Flyer image size must be under 5 MB.' }));
      return;
    }

    setFlyerFile(file);
    setFieldErrors((prev) => ({ ...prev, flyer: null }));
    const reader = new FileReader();
    reader.onloadend = () => setFlyerPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setEventSubmitError(null);

    const errors = {};
    if (!eventFormData.title.trim()) errors.title = 'Event title is required.';
    if (!eventFormData.venue.trim()) errors.venue = 'Venue is required.';
    if (!eventFormData.event_date) errors.event_date = 'Event date is required.';

    if (!editingEvent && !flyerFile && !eventFormData.flyer_url) {
      errors.flyer = 'A flyer image or URL is required for public event discovery.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setEventSubmitting(true);

    let uploadedFlyerPath = eventFormData.flyer_path;
    let uploadedFlyerUrl = eventFormData.flyer_url;

    if (flyerFile) {
      const uploadResult = await uploadFlyer(flyerFile, eventFormData.title);
      if (uploadResult.error) {
        setEventSubmitting(false);
        setEventSubmitError({
          heading: 'Flyer Upload Failed',
          operation: 'Storage Upload (event-flyers)',
          message: uploadResult.error.message || 'Supabase Storage rejected flyer upload.',
          details: 'Ensure bucket event-flyers exists and you have write permissions.',
          code: uploadResult.error.statusCode || 'STORAGE_ERR'
        });
        showToast('error', 'Storage Error', uploadResult.error.message);
        return;
      }
      uploadedFlyerPath = uploadResult.data.path;
      uploadedFlyerUrl = uploadResult.data.publicUrl;
    }

    if (!uploadedFlyerPath) {
      const cleanSlug = eventFormData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      uploadedFlyerPath = `flyers/external-${cleanSlug}-${Date.now()}.png`;
    }

    const payload = {
      ...eventFormData,
      flyer_path: uploadedFlyerPath,
      flyer_url: uploadedFlyerUrl,
      is_published: true
    };

    if (editingEvent) {
      const res = await updateEvent(editingEvent.id, payload);
      setEventSubmitting(false);
      if (res.error) {
        setEventSubmitError({
          heading: 'Could Not Update Event',
          operation: 'Database Update (public.events)',
          code: res.error.code,
          message: res.error.message
        });
        showToast('error', 'Update Failed', res.error.message);
        return;
      }
      setEventModal(false);
      showToast('success', 'Event Updated', `"${payload.title}" updated successfully.`);
      onRefreshData();
    } else {
      const res = await createEvent(payload);
      setEventSubmitting(false);
      if (res.error) {
        setEventSubmitError({
          heading: 'Could Not Create Event',
          operation: 'Database Insert (public.events)',
          code: res.error.code,
          message: res.error.message
        });
        showToast('error', 'Insert Failed', res.error.message);
        return;
      }
      setEventModal(false);
      showToast('success', 'Event Published', `"${payload.title}" is now published.`);
      onRefreshData();
    }
  };

  const handleDeleteEvent = async (id, title = 'Event') => {
    if (window.confirm(`Delete event "${title}"?`)) {
      const res = await deleteEvent(id);
      if (res.error) {
        showToast('error', 'Delete Failed', res.error.message);
      } else {
        showToast('info', 'Event Removed', 'Event removed from database.');
        onRefreshData();
      }
    }
  };

  // ----------------- MIX ACTIONS (YOUTUBE EXTERNAL ONLY) -----------------
  const handleOpenAddMix = () => {
    setEditingMix(null);
    setMixFormData({
      title: '',
      genre: categories[0]?.name || 'Afro-Urban',
      youtube_url: '',
      artwork_url: '',
      duration: 'Live Set'
    });
    setMixSubmitError('');
    setMixModal(true);
  };

  const handleOpenEditMix = (mix) => {
    setEditingMix(mix);
    setMixFormData({
      title: mix.title || '',
      genre: mix.genre || 'Afro-Urban',
      youtube_url: mix.youtube_url || mix.audio_url || '',
      artwork_url: mix.artwork_url || '',
      duration: mix.duration || 'Live Set'
    });
    setMixSubmitError('');
    setMixModal(true);
  };

  const handleSaveMix = async (e) => {
    e.preventDefault();
    setMixSubmitError('');

    if (!mixFormData.title.trim()) {
      setMixSubmitError('Mix title is required.');
      return;
    }

    if (!isValidYouTubeUrl(mixFormData.youtube_url)) {
      setMixSubmitError('Please enter a valid YouTube video URL (e.g. https://youtu.be/... or https://youtube.com/watch?v=...).');
      return;
    }

    setMixSubmitting(true);

    if (editingMix) {
      const res = await updateMix(editingMix.id, mixFormData);
      setMixSubmitting(false);
      if (res.error) {
        setMixSubmitError(res.error.message);
        showToast('error', 'Update Failed', res.error.message);
      } else {
        setMixModal(false);
        showToast('success', 'Mix Updated', `"${mixFormData.title}" updated.`);
        onRefreshData();
      }
    } else {
      const res = await createMix(mixFormData);
      setMixSubmitting(false);
      if (res.error) {
        setMixSubmitError(res.error.message);
        showToast('error', 'Create Failed', res.error.message);
      } else {
        setMixModal(false);
        showToast('success', 'Mix Added', `"${mixFormData.title}" added to Sound Vault.`);
        onRefreshData();
      }
    }
  };

  const handleDeleteMix = async (id, title = 'Mix') => {
    if (window.confirm(`Delete mix "${title}"?`)) {
      const res = await deleteMix(id);
      if (res.error) {
        showToast('error', 'Delete Failed', res.error.message);
      } else {
        showToast('info', 'Mix Removed', 'Mix removed from Sound Vault.');
        onRefreshData();
      }
    }
  };

  // ----------------- SOCIAL ACTIONS (EDITABLE BY PLATFORM) -----------------
  const handleSaveSingleSocial = async (platform) => {
    const url = socialDrafts[platform];
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      showToast('error', 'Invalid URL', 'Please enter a valid URL starting with https://');
      return;
    }

    setSocialSaving((prev) => ({ ...prev, [platform]: true }));
    const res = await saveSocialLink(platform, url);
    setSocialSaving((prev) => ({ ...prev, [platform]: false }));

    if (res.error) {
      showToast('error', 'Save Failed', res.error.message);
    } else {
      showToast('success', 'Saved', `${platform.toUpperCase()} link updated.`);
      onRefreshData();
    }
  };

  // ----------------- TEAM MANAGEMENT (OWNER ONLY) -----------------
  const handleAddDJ = async (e) => {
    e.preventDefault();
    if (!newDJEmail || !newDJEmail.includes('@')) {
      showToast('error', 'Invalid Email', 'Please provide a valid DJ email address.');
      return;
    }

    setAddingDJ(true);
    const res = await addTeamMember(newDJEmail, 'dj', newDJName);
    setAddingDJ(false);

    if (res.error) {
      showToast('error', 'Could Not Authorize DJ', res.error.message);
    } else {
      showToast('success', 'DJ Authorized', `${newDJEmail} has been granted DJ access.`);
      setNewDJEmail('');
      setNewDJName('');
      loadTeam();
    }
  };

  const handleToggleDJStatus = async (id, currentStatus) => {
    const res = await updateTeamMemberStatus(id, !currentStatus);
    if (res.error) {
      showToast('error', 'Update Failed', res.error.message);
    } else {
      showToast('info', 'Status Changed', `Account status updated.`);
      loadTeam();
    }
  };

  const handleDeleteDJ = async (id, email) => {
    if (window.confirm(`Remove DJ access for ${email}?`)) {
      const res = await deleteTeamMember(id);
      if (res.error) {
        showToast('error', 'Delete Failed', res.error.message);
      } else {
        showToast('info', 'Access Revoked', `Account removed.`);
        loadTeam();
      }
    }
  };

  // ----------------- BOOKING ACTIONS -----------------
  const handleUpdateBooking = async (id, status, notes) => {
    const res = await updateBookingStatus(id, status, notes);
    if (res.error) {
      showToast('error', 'Update Failed', res.error.message);
    } else {
      showToast('success', 'Booking Updated', `Status changed to ${status}.`);
      onRefreshData();
    }
  };

  const handleDeleteBooking = async (id) => {
    if (window.confirm('Delete this booking inquiry?')) {
      const res = await deleteBooking(id);
      if (res.error) {
        showToast('error', 'Delete Failed', res.error.message);
      } else {
        showToast('info', 'Inquiry Deleted', 'Record was removed.');
        onRefreshData();
      }
    }
  };

  const handleWhatsAppClient = (booking) => {
    const phone = (booking.client_phone || '').replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Hello ${booking.client_name}! This is the management team for Dj Samizen regarding your booking inquiry for ${booking.event_date}. We'd like to confirm arrangements with you.`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  // ----------------- PROFILE ACTION -----------------
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    const res = await updateProfile(profileForm);
    setProfileSaving(false);

    if (res.error) {
      showToast('error', 'Profile Save Failed', res.error.message);
    } else {
      showToast('success', 'Profile Saved', 'Dj Samizen profile information updated.');
      onRefreshData();
    }
  };

  // ----------------- RENDER LOGIN OVERLAY IF NOT AUTHENTICATED -----------------
  if (!currentUser || userRole === 'unauthorized') {
    return (
      <div className="admin-login-overlay">
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
              <button onClick={() => setToast(null)} className="toast-close-btn">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="admin-login-box">
          <div className="login-icon-hub">
            <Lock size={30} className="login-icon" />
          </div>
          <h2 className="login-title">DJ SAMIZEN PORTAL</h2>
          <p className="login-sub">Sign in with your authorized credentials to manage events, mixes, and bookings.</p>

          {userRole === 'unauthorized' && (
            <div className="auth-unauthorized-banner" style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', padding: '0.85rem', marginBottom: '1.25rem', color: '#fca5a5', fontSize: '0.85rem' }}>
              <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
              <strong>Access Denied:</strong> {currentUser?.email} is not authorized. Sign in as <strong>josephngotho988@gmail.com</strong> or an authorized DJ account.
              <button onClick={handleLogout} className="btn btn-outline btn-sm" style={{ marginTop: '0.65rem', width: '100%' }}>
                Sign Out & Switch Account
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
              <label style={{ fontSize: '0.8rem', color: '#a1a1aa', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                Email Address
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="josephngotho988@gmail.com"
                style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0e0e14', border: '1px solid #232330', color: '#fff', borderRadius: '8px', fontSize: '0.9rem' }}
              />
            </div>

            <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 600 }}>Password</label>
                <button
                  type="button"
                  onClick={() => setResetModal(true)}
                  className="forgot-password-link"
                >
                  Forgot password?
                </button>
              </div>

              <div className="password-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your account password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', backgroundColor: '#0e0e14', border: '1px solid #232330', color: '#fff', borderRadius: '8px', fontSize: '0.9rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {loginError && (
              <div style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: '1rem', textAlign: 'left', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>{loginError}</span>
              </div>
            )}

            <button type="submit" disabled={loginLoading} className="btn btn-primary btn-full" style={{ padding: '0.85rem' }}>
              <span>{loginLoading ? 'Verifying Credentials...' : 'Sign In'}</span>
            </button>
          </form>

          <button onClick={onClose} className="btn btn-outline btn-full back-site-btn" style={{ marginTop: '0.85rem' }}>
            <span>Return to Public Website</span>
          </button>
        </div>

        {/* Password Reset Modal */}
        {resetModal && (
          <div className="modal-backdrop" onClick={() => setResetModal(false)}>
            <div className="modal-form-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
              <div className="modal-form-header">
                <h3>Reset Password</h3>
                <button onClick={() => setResetModal(false)} className="modal-close-btn">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handlePasswordReset} style={{ padding: '1rem 0' }}>
                <p style={{ fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '1rem' }}>
                  Enter your authorized account email to receive a secure password-reset link.
                </p>
                <div className="form-field" style={{ marginBottom: '1rem' }}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="josephngotho988@gmail.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>

                {resetMessage.text && (
                  <p style={{ color: resetMessage.type === 'error' ? '#ef4444' : '#10b981', fontSize: '0.82rem', marginBottom: '1rem' }}>
                    {resetMessage.text}
                  </p>
                )}

                <div className="modal-form-actions">
                  <button type="submit" disabled={resetLoading} className="btn btn-primary btn-full">
                    <span>{resetLoading ? 'Sending link...' : 'Send Password Reset Link'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------- AUTHENTICATED DASHBOARD -----------------
  const isOwner = userRole === 'owner';
  const upcomingCount = events.filter((e) => e.status === 'upcoming').length;
  const newBookingsCount = bookings.filter((b) => b.status === 'new').length;

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
            <button onClick={() => setToast(null)} className="toast-close-btn">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="admin-brand-tag">
            <span>{profile.dj_name || 'Dj Samizen'}</span>
            <span className="admin-badge">{isOwner ? 'OWNER / ADMIN' : 'DJ PORTAL'}</span>
          </div>
        </div>

        <div className="admin-header-right">
          <div className="auth-badge-connected" title={`Signed in as ${currentUser.email}`}>
            <ShieldCheck size={16} />
            <span>{currentUser.email}</span>
          </div>

          <button onClick={onRefreshData} className="admin-icon-btn" title="Refresh Live Data">
            <RefreshCw size={16} />
          </button>

          <button onClick={handleLogout} className="admin-icon-btn" title="Sign Out">
            <LogOut size={16} />
          </button>

          <button onClick={onClose} className="btn btn-secondary btn-sm">
            <span>Exit to Site</span>
          </button>
        </div>
      </header>

      {/* Body Grid */}
      <div className="admin-body-grid">
        {/* Sidebar Nav */}
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
              <span>Events & Flyers</span>
              <span className="tab-count-badge">{events.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('mixes')}
              className={`admin-tab-btn ${activeTab === 'mixes' ? 'active' : ''}`}
            >
              <Radio size={18} />
              <span>YouTube Mixes</span>
              <span className="tab-count-badge">{mixes.length}</span>
            </button>

            {isOwner && (
              <button
                onClick={() => setActiveTab('socials')}
                className={`admin-tab-btn ${activeTab === 'socials' ? 'active' : ''}`}
              >
                <Share2 size={18} />
                <span>Social Links</span>
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => setActiveTab('team')}
                className={`admin-tab-btn ${activeTab === 'team' ? 'active' : ''}`}
              >
                <Users size={18} />
                <span>Team & DJ Access</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('profile')}
              className={`admin-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            >
              <User size={18} />
              <span>Profile & Contacts</span>
            </button>

            {isOwner && (
              <button
                onClick={() => setActiveTab('database')}
                className={`admin-tab-btn ${activeTab === 'database' ? 'active' : ''}`}
              >
                <Database size={18} />
                <span>Database Setup</span>
              </button>
            )}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="admin-main-panel">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="admin-tab-content">
              <div className="tab-header-row">
                <div>
                  <h2 className="tab-main-title">Management Overview</h2>
                  <p className="tab-main-sub">Real-time stats from your live Supabase database.</p>
                </div>
              </div>

              <div className="admin-metrics-row">
                <div className="admin-stat-card">
                  <span className="stat-label">Upcoming Dates</span>
                  <span className="stat-value">{upcomingCount}</span>
                  <span className="stat-sub">Live events on tour schedule</span>
                </div>
                <div className="admin-stat-card">
                  <span className="stat-label">Booking Inquiries</span>
                  <span className="stat-value">{bookings.length}</span>
                  <span className="stat-sub">{newBookingsCount} new submissions</span>
                </div>
                <div className="admin-stat-card">
                  <span className="stat-label">YouTube Mixes</span>
                  <span className="stat-value">{mixes.length}</span>
                  <span className="stat-sub">Sound vault sets published</span>
                </div>
                <div className="admin-stat-card">
                  <span className="stat-label">Role Access</span>
                  <span className="stat-value" style={{ textTransform: 'uppercase', color: 'var(--accent-orange)' }}>
                    {userRole}
                  </span>
                  <span className="stat-sub">{currentUser.email}</span>
                </div>
              </div>

              <div className="admin-quick-actions-card">
                <h3>Quick Management Actions</h3>
                <div className="quick-actions-grid">
                  <button onClick={handleOpenAddEvent} className="btn btn-secondary">
                    <Plus size={16} />
                    <span>Create Event & Upload Flyer</span>
                  </button>
                  <button onClick={handleOpenAddMix} className="btn btn-secondary">
                    <Plus size={16} />
                    <span>Add YouTube Mix</span>
                  </button>
                  <button onClick={() => setActiveTab('bookings')} className="btn btn-secondary">
                    <Send size={16} />
                    <span>Review Booking Requests</span>
                  </button>
                  {isOwner && (
                    <button onClick={() => setActiveTab('socials')} className="btn btn-secondary">
                      <Share2 size={16} />
                      <span>Edit Social Media Links</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: BOOKINGS (INQUIRIES) */}
          {activeTab === 'bookings' && (
            <div className="admin-tab-content">
              <div className="tab-header-row">
                <div>
                  <h2 className="tab-main-title">Client Booking Inquiries</h2>
                  <p className="tab-main-sub">Client submissions sent via the public website inquiry engine.</p>
                </div>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Client / Contact</th>
                      <th>Event Details</th>
                      <th>Notes & Preferences</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty-table-cell">
                          No booking inquiries logged in database yet.
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
                            <div className="cell-meta">Date: <strong>{bk.event_date}</strong></div>
                            <div className="cell-meta">Location: {bk.event_location}</div>
                          </td>
                          <td style={{ maxWidth: '320px', fontSize: '0.84rem' }}>
                            {bk.music_preferences || 'None provided'}
                            {bk.admin_notes && (
                              <div style={{ marginTop: '0.4rem', color: '#f59e0b', fontSize: '0.78rem' }}>
                                <strong>Admin Notes:</strong> {bk.admin_notes}
                              </div>
                            )}
                          </td>
                          <td>
                            <select
                              value={bk.status || 'new'}
                              onChange={(e) => handleUpdateBooking(bk.id, e.target.value, bk.admin_notes)}
                              className="table-status-select"
                              style={{ padding: '0.35rem', borderRadius: '4px', background: '#1c1c28', color: '#fff', border: '1px solid #333' }}
                            >
                              <option value="new">New</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="declined">Declined</option>
                            </select>
                          </td>
                          <td>
                            <div className="action-buttons-cell">
                              <button
                                onClick={() => handleWhatsAppClient(bk)}
                                className="action-btn-whatsapp"
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare size={15} />
                              </button>
                              {isOwner && (
                                <button
                                  onClick={() => handleDeleteBooking(bk.id)}
                                  className="action-btn-delete"
                                  title="Delete Record"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
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
                  <h2 className="tab-main-title">Tour Events & Official Flyers</h2>
                  <p className="tab-main-sub">Manage upcoming gigs and upload 4:5 portrait flyers.</p>
                </div>
                <button onClick={handleOpenAddEvent} className="btn btn-primary btn-sm">
                  <Plus size={16} />
                  <span>Create Event</span>
                </button>
              </div>

              <div className="admin-events-grid">
                {events.length === 0 ? (
                  <div className="empty-state-card">
                    <p>No events in database. Click "Create Event" to post an upcoming date with its flyer.</p>
                  </div>
                ) : (
                  events.map((evt) => (
                    <div key={evt.id} className="admin-event-card">
                      <div className="admin-event-flyer-thumb">
                        <img
                          src={evt.flyer_url || '/images/dj-samizen.png'}
                          alt={evt.title}
                          onError={(e) => {
                            e.currentTarget.src = '/images/dj-samizen.png';
                          }}
                        />
                      </div>
                      <div className="admin-event-details">
                        <div className="admin-event-badges">
                          <span className="badge badge-tag">{evt.status?.toUpperCase() || 'UPCOMING'}</span>
                          {evt.category && <span className="badge badge-tag">{evt.category}</span>}
                        </div>
                        <h4>{evt.title}</h4>
                        <div className="cell-meta">📅 {evt.event_date} {evt.event_time ? `• ${evt.event_time}` : ''}</div>
                        <div className="cell-meta">📍 {evt.venue}{evt.city ? `, ${evt.city}` : ''}</div>
                        <div className="admin-event-actions-row">
                          <button onClick={() => handleOpenEditEvent(evt)} className="btn btn-secondary btn-sm">
                            <Edit2 size={14} />
                            <span>Edit</span>
                          </button>
                          <button onClick={() => handleDeleteEvent(evt.id, evt.title)} className="action-btn-delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: MIXES (YOUTUBE EXTERNAL ONLY) */}
          {activeTab === 'mixes' && (
            <div className="admin-tab-content">
              <div className="tab-header-row">
                <div>
                  <h2 className="tab-main-title">YouTube Mixes & Sound Vault</h2>
                  <p className="tab-main-sub">Publish external YouTube live sets and club sessions (no local MP3 hosting).</p>
                </div>
                <button onClick={handleOpenAddMix} className="btn btn-primary btn-sm">
                  <Plus size={16} />
                  <span>Add Mix</span>
                </button>
              </div>

              <div className="admin-mixes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {mixes.length === 0 ? (
                  <div className="empty-state-card" style={{ gridColumn: '1 / -1' }}>
                    <p>No mixes in database. Click "Add Mix" to paste a YouTube set link.</p>
                  </div>
                ) : (
                  mixes.map((mix) => {
                    const targetUrl = mix.youtube_url || mix.audio_url || '#';
                    const ytId = extractYouTubeId(targetUrl);
                    const thumb = mix.artwork_url || (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : '/images/dj-samizen.png');

                    return (
                      <div key={mix.id} className="admin-mix-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '1rem', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: '6px', marginBottom: '0.75rem', position: 'relative' }}>
                          <img
                            src={thumb}
                            alt={mix.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.src = '/images/dj-samizen.png';
                            }}
                          />
                          {mix.duration && (
                            <span style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.8)', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px' }}>
                              {mix.duration}
                            </span>
                          )}
                        </div>

                        <span style={{ fontSize: '0.72rem', color: 'var(--accent-orange)', fontWeight: 700, textTransform: 'uppercase' }}>
                          {mix.genre || 'Afro-Urban'}
                        </span>
                        <h4 style={{ margin: '0.25rem 0 0.5rem', fontSize: '0.95rem' }}>{mix.title}</h4>

                        <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <a
                            href={targetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, fontSize: '0.78rem' }}
                          >
                            <ExternalLink size={13} />
                            <span>Watch</span>
                          </a>
                          <button onClick={() => handleOpenEditMix(mix)} className="btn btn-secondary btn-sm" title="Edit">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDeleteMix(mix.id, mix.title)} className="action-btn-delete" title="Delete">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB: SOCIAL LINKS (EDITABLE BY PLATFORM) */}
          {activeTab === 'socials' && isOwner && (
            <div className="admin-tab-content">
              <div className="tab-header-row">
                <div>
                  <h2 className="tab-main-title">Official Social Media Channels</h2>
                  <p className="tab-main-sub">
                    Directly edit each platform's profile URL. Blank links are automatically excluded from the public site.
                  </p>
                </div>
              </div>

              <div className="social-editor-grid">
                {['facebook', 'youtube', 'tiktok', 'instagram', 'x'].map((platform) => {
                  const currentVal = socialDrafts[platform] || '';
                  const isConfigured = Boolean(currentVal.trim());

                  return (
                    <div key={platform} className="social-editor-row">
                      <div className="social-platform-badge">
                        <span style={{ textTransform: 'capitalize' }}>{platform === 'x' ? 'X (Twitter)' : platform}</span>
                        {isConfigured ? (
                          <span className="badge badge-live" style={{ fontSize: '0.65rem' }}>ACTIVE</span>
                        ) : (
                          <span className="badge badge-tag" style={{ fontSize: '0.65rem' }}>BLANK</span>
                        )}
                      </div>

                      <input
                        type="url"
                        placeholder={`https://${platform === 'x' ? 'x.com' : platform + '.com'}/your-profile`}
                        value={currentVal}
                        onChange={(e) =>
                          setSocialDrafts({ ...socialDrafts, [platform]: e.target.value })
                        }
                        className="social-input-field"
                      />

                      <div className="social-actions-group">
                        <button
                          type="button"
                          disabled={socialSaving[platform]}
                          onClick={() => handleSaveSingleSocial(platform)}
                          className="btn btn-primary btn-sm"
                        >
                          <Check size={14} />
                          <span>{socialSaving[platform] ? 'Saving...' : 'Save'}</span>
                        </button>

                        {isConfigured && (
                          <a
                            href={currentVal}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                            title="Test Link"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: TEAM & DJ ACCESS (OWNER ONLY) */}
          {activeTab === 'team' && isOwner && (
            <div className="admin-tab-content">
              <div className="tab-header-row">
                <div>
                  <h2 className="tab-main-title">Team & DJ Access Management</h2>
                  <p className="tab-main-sub">Authorize team members to manage events and mixes without giving them owner privileges.</p>
                </div>
              </div>

              {/* Add DJ Form */}
              <div className="admin-form-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '1.25rem', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Authorize New DJ / Manager</h3>
                <form onSubmit={handleAddDJ} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                  <div className="form-field" style={{ margin: 0 }}>
                    <label>DJ Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="dj.name@example.com"
                      value={newDJEmail}
                      onChange={(e) => setNewDJEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-field" style={{ margin: 0 }}>
                    <label>Display Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="DJ Samizen Co-Host"
                      value={newDJName}
                      onChange={(e) => setNewDJName(e.target.value)}
                    />
                  </div>
                  <button type="submit" disabled={addingDJ} className="btn btn-primary" style={{ height: '42px' }}>
                    <Plus size={16} />
                    <span>{addingDJ ? 'Authorizing...' : 'Authorize Account'}</span>
                  </button>
                </form>
              </div>

              {/* Team Members List */}
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Team Member</th>
                      <th>Role</th>
                      <th>Access Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong>josephngotho988@gmail.com</strong>
                        <div className="cell-sub">Primary Platform Administrator</div>
                      </td>
                      <td>
                        <span className="badge badge-live">OWNER</span>
                      </td>
                      <td>
                        <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>Active Permanent</span>
                      </td>
                      <td>
                        <span className="cell-meta">Primary Admin</span>
                      </td>
                    </tr>
                    {teamMembers.map((tm) => {
                      if (tm.email.toLowerCase() === 'josephngotho988@gmail.com') return null;
                      return (
                        <tr key={tm.id}>
                          <td>
                            <strong>{tm.display_name || tm.email}</strong>
                            <div className="cell-sub">{tm.email}</div>
                          </td>
                          <td>
                            <span className="badge badge-tag" style={{ textTransform: 'uppercase' }}>{tm.role}</span>
                          </td>
                          <td>
                            <span style={{ color: tm.is_active ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>
                              {tm.is_active ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons-cell">
                              <button
                                onClick={() => handleToggleDJStatus(tm.id, tm.is_active)}
                                className="btn btn-secondary btn-sm"
                              >
                                {tm.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteDJ(tm.id, tm.email)}
                                className="action-btn-delete"
                                title="Revoke Access"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: PROFILE */}
          {activeTab === 'profile' && (
            <div className="admin-tab-content">
              <div className="tab-header-row">
                <div>
                  <h2 className="tab-main-title">Profile, Biography & Direct Contacts</h2>
                  <p className="tab-main-sub">Update artist bio, contact information, and stage location.</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="admin-profile-form">
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
                  <label>Artist Bio</label>
                  <textarea
                    rows="5"
                    value={profileForm.bio || ''}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  ></textarea>
                </div>

                <button type="submit" disabled={profileSaving} className="btn btn-primary">
                  <span>{profileSaving ? 'Saving Profile...' : 'Save Profile'}</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB: DATABASE SETUP */}
          {activeTab === 'database' && isOwner && (
            <div className="admin-tab-content">
              <div className="tab-header-row">
                <div>
                  <h2 className="tab-main-title">Database Status & Security Policies</h2>
                  <p className="tab-main-sub">Verify connection to Supabase project mkjzswvnrqvnedqdgukg.</p>
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
                      <span>Checking connection...</span>
                    </div>
                  )}
                  <button onClick={checkBackend} className="btn btn-secondary btn-sm">
                    <RefreshCw size={14} />
                    <span>Re-check Connection</span>
                  </button>
                </div>

                <div className="migration-instructions-box">
                  <h3>Production SQL Migration:</h3>
                  <p style={{ fontSize: '0.85rem', color: '#a1a1aa', marginBottom: '1rem' }}>
                    To ensure Row Level Security policies, storage policies, and team member tables are active on your Supabase project, execute the migration script in the SQL editor:
                  </p>
                  <ol className="step-list">
                    <li>
                      Open your Supabase project:{' '}
                      <a
                        href="https://supabase.com/dashboard/project/mkjzswvnrqvnedqdgukg/sql/new"
                        target="_blank"
                        rel="noreferrer"
                        className="supabase-link"
                      >
                        Open Supabase SQL Editor <ExternalLink size={14} />
                      </a>
                    </li>
                    <li>Copy the clean production schema below and paste it into the editor.</li>
                    <li>Click <strong>Run</strong> in Supabase.</li>
                  </ol>

                  <button
                    onClick={() => {
                      fetch('/supabase/schema.sql')
                        .then((r) => r.text())
                        .then((text) => {
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
              <h3>{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
              <button
                type="button"
                disabled={eventSubmitting}
                onClick={() => setEventModal(false)}
                className="modal-close-btn"
              >
                <X size={20} />
              </button>
            </div>

            {eventSubmitError && (
              <div className="modal-error-panel" role="alert">
                <div className="error-panel-header">
                  <AlertTriangle size={20} />
                  <span className="error-panel-heading">{eventSubmitError.heading || 'Submission Failed'}</span>
                </div>
                <p className="error-panel-desc">{eventSubmitError.message}</p>
              </div>
            )}

            <form onSubmit={handleSaveEvent} className="modal-actual-form">
              <div className="form-field">
                <label>Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CLUB 47 PARTY"
                  value={eventFormData.title}
                  className={fieldErrors.title ? 'input-has-error' : ''}
                  onChange={(e) => {
                    setEventFormData({ ...eventFormData, title: e.target.value });
                    if (fieldErrors.title) setFieldErrors({ ...fieldErrors, title: null });
                  }}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Venue *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mukurwe-ini"
                    value={eventFormData.venue}
                    className={fieldErrors.venue ? 'input-has-error' : ''}
                    onChange={(e) => {
                      setEventFormData({ ...eventFormData, venue: e.target.value });
                      if (fieldErrors.venue) setFieldErrors({ ...fieldErrors, venue: null });
                    }}
                  />
                </div>
                <div className="form-field">
                  <label>City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nyeri"
                    value={eventFormData.city}
                    onChange={(e) => setEventFormData({ ...eventFormData, city: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Event Date *</label>
                  <input
                    type="date"
                    required
                    value={eventFormData.event_date}
                    className={fieldErrors.event_date ? 'input-has-error' : ''}
                    onChange={(e) => {
                      setEventFormData({ ...eventFormData, event_date: e.target.value });
                      if (fieldErrors.event_date) setFieldErrors({ ...fieldErrors, event_date: null });
                    }}
                  />
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

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Category</label>
                  <select
                    value={eventFormData.category_id || eventFormData.category || ''}
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      const matched = categories.find((c) => c.id === selectedVal || c.name === selectedVal);
                      setEventFormData({
                        ...eventFormData,
                        category_id: matched?.id || null,
                        category: matched?.name || selectedVal
                      });
                    }}
                  >
                    <option value="Club Night">Club Night</option>
                    <option value="Festival">Festival</option>
                    <option value="Private Event">Private Event</option>
                    {categories.map((c) => (
                      <option key={c.id || c.slug} value={c.id}>
                        {c.name}
                      </option>
                    ))}
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

              {/* Flyer Upload */}
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
                      {flyerFile ? 'Click to change image' : 'Click or drop flyer image here'}
                    </span>
                    <span className="upload-prompt-sub">JPEG, PNG, or WebP up to 5 MB</span>
                  </div>
                </div>

                {(flyerPreview || eventFormData.flyer_url) && (
                  <div className="flyer-preview-card">
                    <img
                      src={flyerPreview || eventFormData.flyer_url}
                      alt="Flyer Preview"
                      className="flyer-preview-thumb"
                    />
                    <div className="flyer-preview-details">
                      <div className="flyer-preview-name">{flyerFile ? flyerFile.name : 'Linked Event Flyer'}</div>
                      <div className="flyer-preview-meta">
                        {flyerFile ? `${(flyerFile.size / (1024 * 1024)).toFixed(2)} MB` : 'Storage Connected'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-field">
                <label>Ticket / RSVP Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={eventFormData.ticket_url || ''}
                  onChange={(e) => setEventFormData({ ...eventFormData, ticket_url: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Description (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Special guest appearances, dress code, VIP details..."
                  value={eventFormData.description || ''}
                  onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-form-actions">
                <button type="submit" disabled={eventSubmitting} className="btn btn-primary">
                  <span>{eventSubmitting ? 'Saving Event...' : editingEvent ? 'Update Event' : 'Publish Event'}</span>
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

      {/* MIX MODAL (YOUTUBE EXTERNAL ONLY) */}
      {mixModal && (
        <div className="modal-backdrop" onClick={() => !mixSubmitting && setMixModal(false)}>
          <div className="modal-form-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-form-header">
              <h3>{editingMix ? 'Edit YouTube Mix' : 'Add YouTube Mix'}</h3>
              <button onClick={() => setMixModal(false)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            {mixSubmitError && (
              <div className="modal-error-panel" role="alert">
                <p className="error-panel-desc">{mixSubmitError}</p>
              </div>
            )}

            <form onSubmit={handleSaveMix} className="modal-actual-form">
              <div className="form-field">
                <label>Mix Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BEST OF SALIM JUNIOR"
                  value={mixFormData.title}
                  onChange={(e) => setMixFormData({ ...mixFormData, title: e.target.value })}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-field">
                  <label>Genre / Style</label>
                  <input
                    type="text"
                    placeholder="e.g. MUGITHI, AFROBEATS"
                    value={mixFormData.genre}
                    onChange={(e) => setMixFormData({ ...mixFormData, genre: e.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label>Duration</label>
                  <input
                    type="text"
                    placeholder="e.g. 55:21"
                    value={mixFormData.duration}
                    onChange={(e) => setMixFormData({ ...mixFormData, duration: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-field">
                <label>External YouTube URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://youtu.be/... or https://www.youtube.com/watch?v=..."
                  value={mixFormData.youtube_url}
                  onChange={(e) => setMixFormData({ ...mixFormData, youtube_url: e.target.value })}
                />
                <span style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '4px', display: 'block' }}>
                  Visitors will listen on YouTube directly. Artwork thumbnail will auto-generate from YouTube if left blank.
                </span>
              </div>

              <div className="form-field">
                <label>Custom Artwork URL (Optional)</label>
                <input
                  type="url"
                  placeholder="Leave blank to use YouTube thumbnail automatically"
                  value={mixFormData.artwork_url}
                  onChange={(e) => setMixFormData({ ...mixFormData, artwork_url: e.target.value })}
                />
              </div>

              <div className="modal-form-actions">
                <button type="submit" disabled={mixSubmitting} className="btn btn-primary">
                  <span>{mixSubmitting ? 'Saving Mix...' : editingMix ? 'Update Mix' : 'Publish Mix'}</span>
                </button>
                <button type="button" onClick={() => setMixModal(false)} className="btn btn-secondary">
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
