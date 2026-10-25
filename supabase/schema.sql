-- ==============================================================================
-- DJ SAMIZEN OFFICIAL SUPABASE PRODUCTION SCHEMA & SECURITY POLICIES
-- Project Reference: mkjzswvnrqvnedqdgukg
-- Region: eu-central-1
-- Administrator Email: josephngotho988@gmail.com
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE MIXES TABLE (if not yet in schema)
CREATE TABLE IF NOT EXISTS public.mixes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    genre TEXT DEFAULT 'Afro-Urban',
    duration TEXT,
    audio_url TEXT,
    stream_url TEXT,
    artwork_url TEXT,
    tracklist TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREATE BOOKINGS TABLE (if not yet in schema)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_location TEXT NOT NULL,
    music_preferences TEXT,
    status TEXT DEFAULT 'new',
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. RECONCILE EVENTS TABLE COLUMNS
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Nairobi';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS flyer_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category TEXT;

-- 5. ENABLE ROW LEVEL SECURITY ACROSS ALL TABLES
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- 6. DROP UNRESTRICTED / CONFLICTING POLICIES
DROP POLICY IF EXISTS "Public read events" ON public.events;
DROP POLICY IF EXISTS "Manage events policy" ON public.events;
DROP POLICY IF EXISTS "Public read mixes" ON public.mixes;
DROP POLICY IF EXISTS "Manage mixes policy" ON public.mixes;
DROP POLICY IF EXISTS "Public read bookings" ON public.bookings;
DROP POLICY IF EXISTS "Public insert bookings" ON public.bookings;
DROP POLICY IF EXISTS "Manage bookings policy" ON public.bookings;
DROP POLICY IF EXISTS "Public read dj_profile" ON public.dj_profile;
DROP POLICY IF EXISTS "Manage dj_profile policy" ON public.dj_profile;
DROP POLICY IF EXISTS "Public read event_categories" ON public.event_categories;
DROP POLICY IF EXISTS "Manage event_categories policy" ON public.event_categories;
DROP POLICY IF EXISTS "Public read social_links" ON public.social_links;
DROP POLICY IF EXISTS "Manage social_links policy" ON public.social_links;

-- 7. REFINED LEAST-PRIVILEGE RLS POLICIES

-- A. EVENTS
-- Public visitors may read only published events
CREATE POLICY "Public read published events" ON public.events
    FOR SELECT
    USING (is_published = true);

-- Authorized admin can read all events (including unpublished drafts)
CREATE POLICY "Admin select events" ON public.events
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'josephngotho988@gmail.com');

-- Authorized admin can insert, update, delete events
CREATE POLICY "Admin insert events" ON public.events
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'email' = 'josephngotho988@gmail.com');

CREATE POLICY "Admin update events" ON public.events
    FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'josephngotho988@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'josephngotho988@gmail.com');

CREATE POLICY "Admin delete events" ON public.events
    FOR DELETE
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'josephngotho988@gmail.com');

-- B. EVENT CATEGORIES
-- Public visitors may read active categories
CREATE POLICY "Public read active categories" ON public.event_categories
    FOR SELECT
    USING (is_active = true);

-- Authorized admin can manage categories
CREATE POLICY "Admin manage categories" ON public.event_categories
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'josephngotho988@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'josephngotho988@gmail.com');

-- C. DJ PROFILE
-- Public visitors can read the DJ profile
CREATE POLICY "Public read profile" ON public.dj_profile
    FOR SELECT
    USING (true);

-- Authorized admin can update the DJ profile
CREATE POLICY "Admin update profile" ON public.dj_profile
    FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'josephngotho988@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'josephngotho988@gmail.com');

-- D. SOCIAL LINKS
-- Public visitors can read active social links
CREATE POLICY "Public read social links" ON public.social_links
    FOR SELECT
    USING (is_active = true);

-- Authorized admin can manage social links
CREATE POLICY "Admin manage social links" ON public.social_links
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'josephngotho988@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'josephngotho988@gmail.com');

-- E. MIXES
-- Public visitors can read mixes
CREATE POLICY "Public read mixes" ON public.mixes
    FOR SELECT
    USING (true);

-- Authorized admin can manage mixes
CREATE POLICY "Admin manage mixes" ON public.mixes
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'josephngotho988@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'josephngotho988@gmail.com');

-- F. BOOKINGS (High-security client information)
-- Public visitors CANNOT select or read client bookings or admin notes
-- Public visitors may ONLY insert a booking inquiry
CREATE POLICY "Public submit booking inquiry" ON public.bookings
    FOR INSERT
    WITH CHECK (
        length(client_name) > 0 AND 
        length(client_phone) > 0 AND 
        status = 'new'
    );

-- Only authorized admin may view, update, or delete booking records
CREATE POLICY "Admin manage bookings" ON public.bookings
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'email' = 'josephngotho988@gmail.com')
    WITH CHECK (auth.jwt() ->> 'email' = 'josephngotho988@gmail.com');

-- 8. STORAGE POLICIES FOR 'event-flyers' BUCKET
-- Public can read flyers
CREATE POLICY "Public read event-flyers" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'event-flyers');

-- Authorized administrator can upload flyers
CREATE POLICY "Admin upload event-flyers" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'event-flyers' AND 
        auth.jwt() ->> 'email' = 'josephngotho988@gmail.com'
    );

-- Authorized administrator can update/replace flyers
CREATE POLICY "Admin update event-flyers" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'event-flyers' AND 
        auth.jwt() ->> 'email' = 'josephngotho988@gmail.com'
    );

-- Authorized administrator can delete flyers
CREATE POLICY "Admin delete event-flyers" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'event-flyers' AND 
        auth.jwt() ->> 'email' = 'josephngotho988@gmail.com'
    );
