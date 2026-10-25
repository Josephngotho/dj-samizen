import { createClient } from '@supabase/supabase-js';
import {
  INITIAL_PROFILE,
  INITIAL_CATEGORIES,
  INITIAL_EVENTS,
  INITIAL_MIXES,
  INITIAL_BOOKINGS,
  INITIAL_SOCIALS
} from './initialData';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mkjzswvnrqvnedqdgukg.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_uPcnCOjDQkEgFmG9Lpmo0Q_vRrfoDSB';

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

// Table availability cache to avoid repeated 404 network requests if tables are pending in Supabase
const knownMissingTables = new Set();

/**
 * Structured diagnostic logger for Supabase operations.
 * Safely captures error codes, details, and hints without exposing sensitive tokens or credentials.
 */
export function reportSupabaseError(operation, error) {
  if (error && typeof error === 'object') {
    const e = error;
    const diagnostic = {
      operation,
      code: e.code || e.statusCode || e.status || null,
      message: e.message || String(error),
      details: e.details || null,
      hint: e.hint || null,
      status: e.status || null,
    };
    console.error(`[DJ Samizen] ${operation} failed:`, diagnostic);
    return diagnostic;
  }
  console.error(`[DJ Samizen] ${operation} failed:`, error);
  return { operation, message: String(error) };
}

// Local Storage Helpers
const getLocal = (key, fallback) => {
  try {
    const item = localStorage.getItem(`djsamizen_${key}`);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    return fallback;
  }
};

const setLocal = (key, data) => {
  try {
    localStorage.setItem(`djsamizen_${key}`, JSON.stringify(data));
  } catch (err) {
    console.warn(`Error saving localStorage for ${key}:`, err);
  }
};

// ----------------- AUTHENTICATION HELPERS -----------------
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getAdminSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return null;
    return session;
  } catch {
    return null;
  }
}

export async function signInAdminWithPassword(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      reportSupabaseError('Admin password sign-in', error);
      return { user: null, session: null, error };
    }
    return { user: data.user, session: data.session, error: null };
  } catch (err) {
    reportSupabaseError('Admin password sign-in exception', err);
    return { user: null, session: null, error: err };
  }
}

export async function signInAdminWithOtp(email) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) {
      reportSupabaseError('Admin OTP sign-in', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    reportSupabaseError('Admin OTP sign-in exception', err);
    return { data: null, error: err };
  }
}

export async function signOutAdmin() {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Sign-out error:', err);
  }
}

// ----------------- BACKEND STATUS -----------------
export async function checkBackendStatus() {
  try {
    const { error: profileError } = await supabase.from('dj_profile').select('id').limit(1);
    const { error: eventsError } = await supabase.from('events').select('id').limit(1);
    const { error: bookingsError } = await supabase.from('bookings').select('id').limit(1);
    const { error: mixesError } = await supabase.from('mixes').select('id').limit(1);

    const missingTables = [];
    if (bookingsError?.code === 'PGRST205') missingTables.push('bookings');
    if (mixesError?.code === 'PGRST205') missingTables.push('mixes');

    return {
      online: !profileError && !eventsError,
      hasMissingTables: missingTables.length > 0,
      missingTables,
      profileOnline: !profileError,
      eventsOnline: !eventsError,
      eventsError: eventsError ? { code: eventsError.code, message: eventsError.message } : null
    };
  } catch (err) {
    return {
      online: false,
      error: err.message,
      hasMissingTables: true
    };
  }
}

// ----------------- DJ PROFILE (public.dj_profile) -----------------
export async function getProfile() {
  try {
    const { data, error } = await supabase.from('dj_profile').select('*').limit(1).maybeSingle();
    if (!error && data) {
      const mapped = {
        id: data.id,
        dj_name: data.display_name || 'DJ Samizen',
        tagline: data.tagline || 'Afro-urban sound. Unforgettable moments.',
        bio: data.bio || '',
        booking_email: data.booking_email || '',
        booking_phone: data.booking_phone || '',
        booking_whatsapp: data.booking_phone || '',
        hero_image_url: data.profile_image_url || '/images/dj-samizen.png',
        location: 'Nairobi, Kenya'
      };
      setLocal('dj_profile', mapped);
      return mapped;
    }
  } catch (e) {
    // fallback to local
  }
  return getLocal('dj_profile', INITIAL_PROFILE);
}

export async function updateProfile(updatedData) {
  const current = getLocal('dj_profile', INITIAL_PROFILE);
  const merged = { ...current, ...updatedData };
  setLocal('dj_profile', merged);

  try {
    const dbPayload = {
      display_name: merged.dj_name,
      tagline: merged.tagline,
      bio: merged.bio,
      booking_email: merged.booking_email,
      booking_phone: merged.booking_whatsapp || merged.booking_phone,
      profile_image_url: merged.hero_image_url
    };

    const { data: existing, error: findError } = await supabase.from('dj_profile').select('id').limit(1).maybeSingle();
    if (existing?.id) {
      const { data, error } = await supabase.from('dj_profile').update(dbPayload).eq('id', existing.id).select().single();
      if (error) {
        reportSupabaseError('Update profile', error);
        return { data: merged, error };
      }
      return { data: merged, error: null };
    }
  } catch (err) {
    reportSupabaseError('Update profile exception', err);
    return { data: merged, error: err };
  }
  return { data: merged, error: null };
}

// ----------------- STORAGE: EVENT FLYERS -----------------
/**
 * Uploads a flyer image to the 'event-flyers' bucket.
 * Validates format (JPEG, PNG, WebP) and size (<= 5MB).
 * Returns { data: { path, publicUrl }, error: null } or { data: null, error }.
 */
export async function uploadFlyer(file, title = 'event') {
  if (!file) {
    return { data: null, error: { message: 'No file provided for flyer upload.' } };
  }

  // 1. Validate file MIME type
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimes.includes(file.type)) {
    const err = {
      message: `Invalid file format (${file.type || 'unknown'}). Only JPEG, PNG, and WebP images are permitted by storage policies.`,
      code: 'INVALID_MIME_TYPE'
    };
    reportSupabaseError('Flyer MIME validation', err);
    return { data: null, error: err };
  }

  // 2. Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    const err = {
      message: `The selected flyer is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Storage policy limit is 5.00 MB.`,
      code: 'FILE_TOO_LARGE'
    };
    reportSupabaseError('Flyer size validation', err);
    return { data: null, error: err };
  }

  // 3. Construct storage path
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const cleanTitle = (title || 'event')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 30);
  const storagePath = `flyers/${Date.now()}-${cleanTitle}.${ext}`;

  try {
    const { data, error } = await supabase.storage
      .from('event-flyers')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      reportSupabaseError('Flyer storage upload', error);
      return { data: null, error };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('event-flyers')
      .getPublicUrl(storagePath);

    return {
      data: {
        path: storagePath,
        publicUrl: urlData?.publicUrl || ''
      },
      error: null
    };
  } catch (err) {
    reportSupabaseError('Flyer storage upload exception', err);
    return { data: null, error: err };
  }
}

/**
 * Deletes an uploaded flyer from storage (used for rollback when DB insert fails).
 */
export async function deleteFlyer(storagePath) {
  if (!storagePath) return;
  try {
    await supabase.storage.from('event-flyers').remove([storagePath]);
  } catch (err) {
    console.warn('[DJ Samizen] Could not delete orphaned flyer:', storagePath, err);
  }
}

// ----------------- EVENTS (public.events) -----------------
export async function getEvents() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*, event_categories(id, name, slug)')
      .order('event_date', { ascending: true });

    if (!error && data) {
      const mapped = data.map(evt => {
        // Resolve flyer url from path if not explicitly populated
        let resolvedFlyerUrl = evt.flyer_url || '';
        if (!resolvedFlyerUrl && evt.flyer_path) {
          const { data: u } = supabase.storage.from('event-flyers').getPublicUrl(evt.flyer_path);
          resolvedFlyerUrl = u?.publicUrl || '';
        }

        return {
          id: evt.id,
          title: evt.title,
          slug: evt.slug,
          venue: evt.venue || 'TBA',
          city: evt.city || 'Nairobi',
          event_date: evt.event_date,
          event_time: evt.event_time ? evt.event_time.slice(0, 5) : '21:00',
          description: evt.description || '',
          flyer_path: evt.flyer_path,
          flyer_url: resolvedFlyerUrl,
          ticket_url: evt.ticket_url || '',
          category: evt.event_categories?.name || evt.category || 'Club Night',
          category_id: evt.category_id,
          status: evt.status || 'upcoming',
          is_published: evt.is_published ?? true,
          created_at: evt.created_at
        };
      });
      setLocal('events', mapped);
      return mapped;
    }
    if (error) {
      reportSupabaseError('Fetch events', error);
    }
  } catch (e) {
    reportSupabaseError('Fetch events exception', e);
  }
  return getLocal('events', INITIAL_EVENTS);
}

/**
 * Creates an event row in public.events.
 * Returns { data, error } - does NOT swallow database errors!
 */
export async function createEvent(eventData) {
  // 1. Generate unique URL-friendly slug
  const titleSlug = (eventData.title || 'event')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const slug = `${titleSlug}-${Date.now()}`;

  // 2. Prepare schema-valid payload matching public.events live columns
  const payload = {
    title: eventData.title.trim(),
    slug: slug,
    event_date: eventData.event_date,
    flyer_path: eventData.flyer_path || `manual/${Date.now()}`,
    is_published: true,
    event_timezone: 'Africa/Nairobi'
  };

  // Optional string fields
  if (eventData.venue?.trim()) payload.venue = eventData.venue.trim();
  if (eventData.city?.trim()) payload.city = eventData.city.trim();
  if (eventData.description?.trim()) payload.description = eventData.description.trim();
  if (eventData.flyer_url?.trim()) payload.flyer_url = eventData.flyer_url.trim();
  if (eventData.ticket_url?.trim()) payload.ticket_url = eventData.ticket_url.trim();
  if (eventData.status) payload.status = eventData.status;
  if (eventData.category) payload.category = eventData.category;

  // Time format check (HH:MM:SS)
  if (eventData.event_time) {
    const rawTime = eventData.event_time.trim();
    if (rawTime.includes(':')) {
      const parts = rawTime.split(':');
      payload.event_time = `${parts[0].padStart(2, '0')}:${parts[1].slice(0, 2).padStart(2, '0')}:00`;
    }
  }

  // Category UUID - send null if not a valid UUID string
  if (eventData.category_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventData.category_id)) {
    payload.category_id = eventData.category_id;
  } else {
    payload.category_id = null;
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .insert([payload])
      .select('*, event_categories(id, name, slug)')
      .single();

    if (error) {
      reportSupabaseError('Event database insert', error);
      return { data: null, error };
    }

    // Success: update local cache
    const current = getLocal('events', INITIAL_EVENTS);
    const newEvent = {
      ...payload,
      id: data.id,
      category: data.event_categories?.name || payload.category || 'Club Night',
      created_at: data.created_at
    };
    setLocal('events', [newEvent, ...current]);

    return { data: newEvent, error: null };
  } catch (err) {
    reportSupabaseError('Event database insert exception', err);
    return { data: null, error: err };
  }
}

export async function updateEvent(id, eventData) {
  const payload = {};
  if (eventData.title !== undefined) payload.title = eventData.title.trim();
  if (eventData.venue !== undefined) payload.venue = eventData.venue?.trim() || null;
  if (eventData.city !== undefined) payload.city = eventData.city?.trim() || 'Nairobi';
  if (eventData.event_date !== undefined) payload.event_date = eventData.event_date;
  if (eventData.description !== undefined) payload.description = eventData.description?.trim() || null;
  if (eventData.flyer_path !== undefined) payload.flyer_path = eventData.flyer_path;
  if (eventData.flyer_url !== undefined) payload.flyer_url = eventData.flyer_url?.trim() || null;
  if (eventData.ticket_url !== undefined) payload.ticket_url = eventData.ticket_url?.trim() || null;
  if (eventData.status !== undefined) payload.status = eventData.status;
  if (eventData.category !== undefined) payload.category = eventData.category;
  if (eventData.is_published !== undefined) payload.is_published = eventData.is_published;

  if (eventData.event_time) {
    const rawTime = eventData.event_time.trim();
    if (rawTime.includes(':')) {
      const parts = rawTime.split(':');
      payload.event_time = `${parts[0].padStart(2, '0')}:${parts[1].slice(0, 2).padStart(2, '0')}:00`;
    }
  }

  if (eventData.category_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventData.category_id)) {
    payload.category_id = eventData.category_id;
  }

  try {
    const { data, error } = await supabase
      .from('events')
      .update(payload)
      .eq('id', id)
      .select('*, event_categories(id, name, slug)')
      .single();

    if (error) {
      reportSupabaseError('Update event', error);
      return { data: null, error };
    }

    const current = getLocal('events', INITIAL_EVENTS);
    const updated = current.map(item => item.id === id ? { ...item, ...payload } : item);
    setLocal('events', updated);

    return { data, error: null };
  } catch (err) {
    reportSupabaseError('Update event exception', err);
    return { data: null, error: err };
  }
}

export async function deleteEvent(id) {
  try {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      reportSupabaseError('Delete event', error);
      return { success: false, error };
    }
    const current = getLocal('events', INITIAL_EVENTS);
    const updated = current.filter(item => item.id !== id);
    setLocal('events', updated);
    return { success: true, error: null };
  } catch (err) {
    reportSupabaseError('Delete event exception', err);
    return { success: false, error: err };
  }
}

// ----------------- GENRES / CATEGORIES (public.event_categories) -----------------
export async function getCategories() {
  try {
    const { data, error } = await supabase
      .from('event_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      const mapped = data.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.name + ' sounds & selection'
      }));
      setLocal('event_categories', mapped);
      return mapped;
    }
  } catch (e) {
    // fallback
  }
  return getLocal('event_categories', INITIAL_CATEGORIES);
}

export async function createCategory(catData) {
  try {
    const payload = {
      name: catData.name,
      slug: catData.slug || catData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      is_active: true
    };
    const { data, error } = await supabase.from('event_categories').insert([payload]).select().single();
    if (error) {
      reportSupabaseError('Create category', error);
      return { data: null, error };
    }
    const current = getLocal('event_categories', INITIAL_CATEGORIES);
    setLocal('event_categories', [...current, data]);
    return { data, error: null };
  } catch (err) {
    reportSupabaseError('Create category exception', err);
    return { data: null, error: err };
  }
}

export async function deleteCategory(id) {
  try {
    const { error } = await supabase.from('event_categories').delete().eq('id', id);
    if (error) {
      reportSupabaseError('Delete category', error);
      return { success: false, error };
    }
    const current = getLocal('event_categories', INITIAL_CATEGORIES);
    setLocal('event_categories', current.filter(item => item.id !== id));
    return { success: true, error: null };
  } catch (err) {
    reportSupabaseError('Delete category exception', err);
    return { success: false, error: err };
  }
}

// ----------------- MIXES (public.mixes) -----------------
export async function getMixes() {
  if (knownMissingTables.has('mixes')) {
    return getLocal('mixes', INITIAL_MIXES);
  }

  try {
    const { data, error } = await supabase
      .from('mixes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLocal('mixes', data);
      return data;
    }
    if (error && error.code === 'PGRST205') {
      knownMissingTables.add('mixes');
    }
  } catch (e) {
    knownMissingTables.add('mixes');
  }
  return getLocal('mixes', INITIAL_MIXES);
}

export async function createMix(mixData) {
  try {
    const { data, error } = await supabase.from('mixes').insert([mixData]).select().single();
    if (error) {
      if (error.code === 'PGRST205') knownMissingTables.add('mixes');
      reportSupabaseError('Create mix', error);
      return { data: null, error };
    }
    const current = getLocal('mixes', INITIAL_MIXES);
    setLocal('mixes', [data, ...current]);
    return { data, error: null };
  } catch (err) {
    reportSupabaseError('Create mix exception', err);
    return { data: null, error: err };
  }
}

export async function deleteMix(id) {
  try {
    const { error } = await supabase.from('mixes').delete().eq('id', id);
    if (error) {
      reportSupabaseError('Delete mix', error);
      return { success: false, error };
    }
    const current = getLocal('mixes', INITIAL_MIXES);
    setLocal('mixes', current.filter(item => item.id !== id));
    return { success: true, error: null };
  } catch (err) {
    reportSupabaseError('Delete mix exception', err);
    return { success: false, error: err };
  }
}

// ----------------- SOCIAL LINKS (public.social_links) -----------------
export async function getSocialLinks() {
  try {
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .order('display_order', { ascending: true });

    if (!error && data && data.length > 0) {
      setLocal('social_links', data);
      return data;
    }
  } catch (e) {
    // fallback
  }
  return getLocal('social_links', INITIAL_SOCIALS);
}

export async function saveSocialLink(socialData) {
  try {
    const current = getLocal('social_links', INITIAL_SOCIALS);
    const exists = current.find(s => s.platform === socialData.platform);

    if (exists?.id) {
      const { data, error } = await supabase
        .from('social_links')
        .update({ url: socialData.url, is_active: true })
        .eq('id', exists.id)
        .select()
        .single();
      if (error) {
        reportSupabaseError('Update social link', error);
        return { data: null, error };
      }
      return { data, error: null };
    } else {
      const { data, error } = await supabase
        .from('social_links')
        .insert([{ platform: socialData.platform, url: socialData.url, is_active: true }])
        .select()
        .single();
      if (error) {
        reportSupabaseError('Insert social link', error);
        return { data: null, error };
      }
      return { data, error: null };
    }
  } catch (err) {
    reportSupabaseError('Save social link exception', err);
    return { data: null, error: err };
  }
}

export async function deleteSocialLink(id) {
  try {
    const { error } = await supabase.from('social_links').delete().eq('id', id);
    if (error) {
      reportSupabaseError('Delete social link', error);
      return { success: false, error };
    }
    const current = getLocal('social_links', INITIAL_SOCIALS);
    setLocal('social_links', current.filter(item => item.id !== id));
    return { success: true, error: null };
  } catch (err) {
    reportSupabaseError('Delete social link exception', err);
    return { success: false, error: err };
  }
}

// ----------------- BOOKINGS (public.bookings) -----------------
export async function getBookings() {
  if (knownMissingTables.has('bookings')) {
    return getLocal('bookings', INITIAL_BOOKINGS);
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLocal('bookings', data);
      return data;
    }
    if (error && error.code === 'PGRST205') {
      knownMissingTables.add('bookings');
    }
  } catch (e) {
    knownMissingTables.add('bookings');
  }
  return getLocal('bookings', INITIAL_BOOKINGS);
}

export async function createBooking(bookingData) {
  try {
    const { data, error } = await supabase.from('bookings').insert([bookingData]).select().single();
    if (error) {
      if (error.code === 'PGRST205') knownMissingTables.add('bookings');
      reportSupabaseError('Create booking', error);
      return { data: null, error };
    }
    const current = getLocal('bookings', INITIAL_BOOKINGS);
    setLocal('bookings', [data, ...current]);
    return { data, error: null };
  } catch (err) {
    reportSupabaseError('Create booking exception', err);
    return { data: null, error: err };
  }
}

export async function updateBookingStatus(id, status, adminNotes = '') {
  try {
    const patch = { status };
    if (adminNotes) patch.admin_notes = adminNotes;
    const { data, error } = await supabase.from('bookings').update(patch).eq('id', id).select().single();
    if (error) {
      reportSupabaseError('Update booking status', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    reportSupabaseError('Update booking status exception', err);
    return { data: null, error: err };
  }
}

export async function deleteBooking(id) {
  try {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) {
      reportSupabaseError('Delete booking', error);
      return { success: false, error };
    }
    const current = getLocal('bookings', INITIAL_BOOKINGS);
    setLocal('bookings', current.filter(item => item.id !== id));
    return { success: true, error: null };
  } catch (err) {
    reportSupabaseError('Delete booking exception', err);
    return { success: false, error: err };
  }
}
