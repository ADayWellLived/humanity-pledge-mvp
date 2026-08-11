-- Humanity Pledge MVP+ Database Schema
-- Copy and paste this into Supabase SQL Editor, then run it

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  privacy_default TEXT DEFAULT 'public' CHECK (privacy_default IN ('private', 'friends', 'public')),
  opted_into_aggregate BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pledges table
CREATE TABLE public.pledges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  unit TEXT NOT NULL,
  target INTEGER NOT NULL CHECK (target > 0),
  deadline DATE NOT NULL,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('private', 'friends', 'public')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  schema_version INTEGER DEFAULT 1
);

-- Log entries (each action logged against a pledge)
CREATE TABLE public.log_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pledge_id UUID NOT NULL REFERENCES public.pledges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount INTEGER DEFAULT 1 CHECK (amount > 0),
  emotion_tag TEXT CHECK (emotion_tag IN ('connected', 'joyful', 'proud', 'calm', 'energized', 'grateful', NULL)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  schema_version INTEGER DEFAULT 1
);

-- Following table
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes for performance
CREATE INDEX idx_pledges_user_id ON public.pledges(user_id);
CREATE INDEX idx_pledges_visibility ON public.pledges(visibility);
CREATE INDEX idx_log_entries_pledge_id ON public.log_entries(pledge_id);
CREATE INDEX idx_log_entries_user_id ON public.log_entries(user_id);
CREATE INDEX idx_log_entries_date ON public.log_entries(date);
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);

-- Row-level security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can read any public user profile
CREATE POLICY "Anyone can view public profiles" ON public.users
  FOR SELECT USING (TRUE);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Users can create pledges
CREATE POLICY "Users can create their own pledges" ON public.pledges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can read their own pledges
CREATE POLICY "Users can view their own pledges" ON public.pledges
  FOR SELECT USING (auth.uid() = user_id);

-- Public pledges are readable by anyone
CREATE POLICY "Anyone can view public pledges" ON public.pledges
  FOR SELECT USING (visibility = 'public');

-- Users can update their own pledges
CREATE POLICY "Users can update their own pledges" ON public.pledges
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own pledges
CREATE POLICY "Users can delete their own pledges" ON public.pledges
  FOR DELETE USING (auth.uid() = user_id);

-- Users can create log entries for their pledges
CREATE POLICY "Users can log entries for their pledges" ON public.log_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view log entries for their own pledges
CREATE POLICY "Users can view their own log entries" ON public.log_entries
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create follows
CREATE POLICY "Users can follow others" ON public.follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can view their own follows
CREATE POLICY "Users can view their own follows" ON public.follows
  FOR SELECT USING (auth.uid() = follower_id);

-- Users can delete their follows
CREATE POLICY "Users can unfollow" ON public.follows
  FOR DELETE USING (auth.uid() = follower_id);
