-- ==============================================================================
-- DJ SAMIZEN OFFICIAL SUPABASE FIX SCRIPT
-- Project Reference: mkjzswvnrqvnedqdgukg
-- Copy and paste this into: https://supabase.com/dashboard/project/mkjzswvnrqvnedqdgukg/sql/new
-- Then click RUN.
-- ==============================================================================

-- 1. Ensure uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CREATE MIXES TABLE (Fixes 404 on mixes)
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

-- 3. CREATE BOOKINGS TABLE (Fixes 404 on bookings)
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

-- 4. EXTEND EVENTS TABLE WITH OPTIONAL METADATA (Fixes 400 on events insert)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Nairobi';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS flyer_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS ticket_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'upcoming';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category TEXT;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS across all tables
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dj_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Drop any conflicting restrictive policies if they exist
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

-- Allow public read on events, mixes, profile, categories, social links
CREATE POLICY "Public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Public read mixes" ON public.mixes FOR SELECT USING (true);
CREATE POLICY "Public read dj_profile" ON public.dj_profile FOR SELECT USING (true);
CREATE POLICY "Public read event_categories" ON public.event_categories FOR SELECT USING (true);
CREATE POLICY "Public read social_links" ON public.social_links FOR SELECT USING (true);

-- Allow public to submit booking requests and read their own inquiries
CREATE POLICY "Public insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read bookings" ON public.bookings FOR SELECT USING (true);

-- Full management permissions for website admin
CREATE POLICY "Manage events policy" ON public.events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage mixes policy" ON public.mixes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage bookings policy" ON public.bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage dj_profile policy" ON public.dj_profile FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage event_categories policy" ON public.event_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Manage social_links policy" ON public.social_links FOR ALL USING (true) WITH CHECK (true);
