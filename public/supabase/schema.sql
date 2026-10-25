-- ==============================================================================
-- DJ SAMIZEN PRODUCTION FIXES, ROLE-BASED ACCESS & LEAST-PRIVILEGE SECURITY
-- Migration: 20261026000000_production_fixes_and_roles.sql
-- Project: mkjzswvnrqvnedqdgukg
-- Owner: josephngotho988@gmail.com
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TEAM MEMBERS & ROLES TABLE
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'dj')),
    display_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed Initial Owner
INSERT INTO public.team_members (email, role, display_name, is_active)
VALUES ('josephngotho988@gmail.com', 'owner', 'Joseph Ngotho (Owner)', true)
ON CONFLICT (email) DO UPDATE SET role = 'owner', is_active = true;

-- 3. RECONCILE BOOKINGS TABLE COLUMNS
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_phone TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_location TEXT NOT NULL,
    music_preferences TEXT,
    status TEXT DEFAULT 'new',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS guest_count TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS budget_range TEXT;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- 4. RECONCILE MIXES TABLE COLUMNS
CREATE TABLE IF NOT EXISTS public.mixes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    genre TEXT DEFAULT 'Afro-Urban',
    duration TEXT,
    audio_url TEXT,
    stream_url TEXT,
    artwork_url TEXT,
    tracklist TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.mixes ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE public.mixes ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;
ALTER TABLE public.mixes ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 5. RECONCILE EVENTS TABLE COLUMNS
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Nairobi';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS flyer_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- 6. ROLE HELPER FUNCTION
CREATE OR REPLACE FUNCTION public.get_current_role()
RETURNS TEXT AS $$
DECLARE
    u_email TEXT;
    u_role TEXT;
BEGIN
    u_email := auth.jwt() ->> 'email';
    IF u_email IS NULL THEN
        RETURN 'anon';
    END IF;
    IF lower(u_email) = 'josephngotho988@gmail.com' THEN
        RETURN 'owner';
    END IF;
    SELECT role INTO u_role FROM public.team_members WHERE lower(email) = lower(u_email) AND is_active = true;
    RETURN COALESCE(u_role, 'unauthorized');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ENABLE ROW LEVEL SECURITY ACROSS ALL TABLES
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- 8. DROP EXISTING POLICIES TO AVOID DUPLICATES OR CONFLICTS
DO $$
DECLARE
    tbl text;
    pol text;
BEGIN
    FOR tbl, pol IN
        SELECT tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('events', 'mixes', 'bookings', 'dj_profile', 'event_categories', 'social_links', 'team_members')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);
    END LOOP;
END $$;

-- 9. LEAST-PRIVILEGE RLS POLICIES

-- A. EVENTS
-- Public read published events only
CREATE POLICY "Public read published events" ON public.events
    FOR SELECT
    USING (is_published = true OR public.get_current_role() IN ('owner', 'dj'));

-- Owner & DJ can insert events
CREATE POLICY "Authorized insert events" ON public.events
    FOR INSERT
    TO authenticated
    WITH CHECK (public.get_current_role() IN ('owner', 'dj'));

-- Owner & DJ can update events
CREATE POLICY "Authorized update events" ON public.events
    FOR UPDATE
    TO authenticated
    USING (public.get_current_role() IN ('owner', 'dj'))
    WITH CHECK (public.get_current_role() IN ('owner', 'dj'));

-- Owner & DJ can delete events
CREATE POLICY "Authorized delete events" ON public.events
    FOR DELETE
    TO authenticated
    USING (public.get_current_role() IN ('owner', 'dj'));

-- B. EVENT CATEGORIES
CREATE POLICY "Public read active categories" ON public.event_categories
    FOR SELECT
    USING (is_active = true OR public.get_current_role() IN ('owner', 'dj'));

CREATE POLICY "Owner manage categories" ON public.event_categories
    FOR ALL
    TO authenticated
    USING (public.get_current_role() = 'owner')
    WITH CHECK (public.get_current_role() = 'owner');

-- C. DJ PROFILE
CREATE POLICY "Public read profile" ON public.dj_profile
    FOR SELECT
    USING (true);

CREATE POLICY "Authorized update profile" ON public.dj_profile
    FOR UPDATE
    TO authenticated
    USING (public.get_current_role() IN ('owner', 'dj'))
    WITH CHECK (public.get_current_role() IN ('owner', 'dj'));

-- D. SOCIAL LINKS
CREATE POLICY "Public read active social links" ON public.social_links
    FOR SELECT
    USING (is_active = true AND url IS NOT NULL AND length(url) > 0);

CREATE POLICY "Authorized manage social links" ON public.social_links
    FOR ALL
    TO authenticated
    USING (public.get_current_role() IN ('owner', 'dj'))
    WITH CHECK (public.get_current_role() IN ('owner', 'dj'));

-- E. MIXES
CREATE POLICY "Public read published mixes" ON public.mixes
    FOR SELECT
    USING (is_published = true OR is_published IS NULL OR public.get_current_role() IN ('owner', 'dj'));

CREATE POLICY "Authorized insert mixes" ON public.mixes
    FOR INSERT
    TO authenticated
    WITH CHECK (public.get_current_role() IN ('owner', 'dj'));

CREATE POLICY "Authorized update mixes" ON public.mixes
    FOR UPDATE
    TO authenticated
    USING (public.get_current_role() IN ('owner', 'dj'))
    WITH CHECK (public.get_current_role() IN ('owner', 'dj'));

CREATE POLICY "Authorized delete mixes" ON public.mixes
    FOR DELETE
    TO authenticated
    USING (public.get_current_role() IN ('owner', 'dj'));

-- F. BOOKINGS (STRICT PRIVACY)
-- Anonymous users CANNOT SELECT bookings.
-- Only Owner & DJ can read bookings.
CREATE POLICY "Authorized select bookings" ON public.bookings
    FOR SELECT
    TO authenticated
    USING (public.get_current_role() IN ('owner', 'dj'));

-- Public/Anonymous users can only INSERT a new booking inquiry
CREATE POLICY "Public insert booking inquiry" ON public.bookings
    FOR INSERT
    WITH CHECK (
        length(client_name) > 0 AND 
        length(client_phone) > 0 AND 
        (status IS NULL OR status = 'new')
    );

-- Owner & DJ can update booking status / admin notes
CREATE POLICY "Authorized update bookings" ON public.bookings
    FOR UPDATE
    TO authenticated
    USING (public.get_current_role() IN ('owner', 'dj'))
    WITH CHECK (public.get_current_role() IN ('owner', 'dj'));

-- Owner can delete bookings
CREATE POLICY "Owner delete bookings" ON public.bookings
    FOR DELETE
    TO authenticated
    USING (public.get_current_role() = 'owner');

-- G. TEAM MEMBERS
CREATE POLICY "Owner manage team members" ON public.team_members
    FOR ALL
    TO authenticated
    USING (public.get_current_role() = 'owner')
    WITH CHECK (public.get_current_role() = 'owner');

CREATE POLICY "DJ read own team record" ON public.team_members
    FOR SELECT
    TO authenticated
    USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- 10. STORAGE BUCKET POLICIES FOR 'event-flyers'
-- Drop existing storage policies on event-flyers
DROP POLICY IF EXISTS "Public read event-flyers" ON storage.objects;
DROP POLICY IF EXISTS "Admin upload event-flyers" ON storage.objects;
DROP POLICY IF EXISTS "Admin update event-flyers" ON storage.objects;
DROP POLICY IF EXISTS "Admin delete event-flyers" ON storage.objects;
DROP POLICY IF EXISTS "Authorized upload event-flyers" ON storage.objects;
DROP POLICY IF EXISTS "Authorized update event-flyers" ON storage.objects;
DROP POLICY IF EXISTS "Authorized delete event-flyers" ON storage.objects;

-- Public can view flyers
CREATE POLICY "Public read event-flyers" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'event-flyers');

-- Owner & DJ can upload flyers
CREATE POLICY "Authorized upload event-flyers" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'event-flyers' AND 
        public.get_current_role() IN ('owner', 'dj')
    );

-- Owner & DJ can update flyers
CREATE POLICY "Authorized update event-flyers" ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'event-flyers' AND 
        public.get_current_role() IN ('owner', 'dj')
    );

-- Owner & DJ can delete flyers
CREATE POLICY "Authorized delete event-flyers" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'event-flyers' AND 
        public.get_current_role() IN ('owner', 'dj')
    );

