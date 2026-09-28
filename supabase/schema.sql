-- FilmFlex Database Schema for Supabase
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/vpdrqiyogjffdtohqpqs/sql)

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    is_kids BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Watch Progress Table (Resume Playback / Continue Watching)
-- Enforces UNIQUE(profile_id, movie_id) so duplicate entries are impossible
CREATE TABLE IF NOT EXISTS public.watch_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id TEXT NOT NULL,
    movie_id TEXT NOT NULL,
    current_seconds INTEGER NOT NULL DEFAULT 0,
    total_seconds INTEGER NOT NULL DEFAULT 0,
    percentage INTEGER NOT NULL DEFAULT 0,
    last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_profile_movie_progress UNIQUE (profile_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_progress_profile_date 
ON public.watch_progress (profile_id, last_watched_at DESC);

-- 3. My List Table (Favorites / Bookmarks)
-- Enforces UNIQUE(profile_id, movie_id)
CREATE TABLE IF NOT EXISTS public.my_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id TEXT NOT NULL,
    movie_id TEXT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_profile_movie_mylist UNIQUE (profile_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_my_list_profile 
ON public.my_list (profile_id, added_at DESC);

-- 4. Enable Row Level Security (RLS) & Public Policies for FilmFlex
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.my_list ENABLE ROW LEVEL SECURITY;

-- Allow public access with anon key (read & write)
DROP POLICY IF EXISTS "Public access profiles" ON public.profiles;
CREATE POLICY "Public access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access watch_progress" ON public.watch_progress;
CREATE POLICY "Public access watch_progress" ON public.watch_progress FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access my_list" ON public.my_list;
CREATE POLICY "Public access my_list" ON public.my_list FOR ALL USING (true) WITH CHECK (true);
