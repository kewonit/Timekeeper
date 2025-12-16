-- =====================================================
-- Live Study Map Database Schema for Supabase
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql/new
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Study Sessions Table
-- Stores active and historical study sessions
-- =====================================================
DROP TABLE IF EXISTS public.study_sessions CASCADE;

CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  exam_slug TEXT,
  exam_name TEXT,
  subject TEXT,
  session_name TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  avatar_seed TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_study_sessions_active 
  ON public.study_sessions(is_active) 
  WHERE is_active = TRUE;

CREATE INDEX idx_study_sessions_heartbeat 
  ON public.study_sessions(last_heartbeat) 
  WHERE is_active = TRUE;

CREATE INDEX idx_study_sessions_user 
  ON public.study_sessions(user_id);

CREATE INDEX idx_study_sessions_exam 
  ON public.study_sessions(exam_slug) 
  WHERE is_active = TRUE;

-- =====================================================
-- User Locations Table (cached from IP geolocation)
-- =====================================================
DROP TABLE IF EXISTS public.user_locations CASCADE;

CREATE TABLE public.user_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  ip_address TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  region_code TEXT,
  timezone TEXT,
  accuracy_radius INT DEFAULT 10,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_locations_user 
  ON public.user_locations(user_id);

-- =====================================================
-- Row Level Security Policies
-- =====================================================
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Study Sessions Policies
CREATE POLICY "Anyone can view active sessions"
  ON public.study_sessions FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Users can insert their own sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON public.study_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- User Locations Policies
CREATE POLICY "Users can view their own location"
  ON public.user_locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own location"
  ON public.user_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location"
  ON public.user_locations FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- Functions
-- =====================================================

-- Function to get active sessions count
CREATE OR REPLACE FUNCTION public.get_active_sessions_count()
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.study_sessions
  WHERE is_active = TRUE
    AND last_heartbeat > NOW() - INTERVAL '2 minutes';
$$;

-- Function to get active sessions with location
CREATE OR REPLACE FUNCTION public.get_active_study_sessions()
RETURNS TABLE (
  id UUID,
  exam_slug TEXT,
  exam_name TEXT,
  subject TEXT,
  latitude DECIMAL,
  longitude DECIMAL,
  city TEXT,
  state TEXT,
  avatar_seed TEXT,
  started_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    s.id,
    s.exam_slug,
    s.exam_name,
    s.subject,
    s.latitude,
    s.longitude,
    s.city,
    s.state,
    s.avatar_seed,
    s.started_at
  FROM public.study_sessions s
  WHERE s.is_active = TRUE
    AND s.last_heartbeat > NOW() - INTERVAL '2 minutes';
$$;

-- Function to cleanup stale sessions
CREATE OR REPLACE FUNCTION public.cleanup_stale_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.study_sessions 
  SET is_active = FALSE,
      ended_at = NOW()
  WHERE is_active = TRUE 
    AND last_heartbeat < NOW() - INTERVAL '5 minutes';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Function to start/update a study session
CREATE OR REPLACE FUNCTION public.upsert_study_session(
  p_exam_slug TEXT DEFAULT NULL,
  p_exam_name TEXT DEFAULT NULL,
  p_subject TEXT DEFAULT NULL,
  p_session_name TEXT DEFAULT NULL,
  p_latitude DECIMAL DEFAULT NULL,
  p_longitude DECIMAL DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_state TEXT DEFAULT NULL,
  p_avatar_seed TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_session_id UUID;
  v_avatar TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  v_avatar := COALESCE(p_avatar_seed, v_user_id::TEXT);
  
  SELECT id INTO v_session_id
  FROM public.study_sessions
  WHERE user_id = v_user_id AND is_active = TRUE
  LIMIT 1;
  
  IF v_session_id IS NOT NULL THEN
    UPDATE public.study_sessions
    SET exam_slug = COALESCE(p_exam_slug, exam_slug),
        exam_name = COALESCE(p_exam_name, exam_name),
        subject = COALESCE(p_subject, subject),
        session_name = COALESCE(p_session_name, session_name),
        latitude = COALESCE(p_latitude, latitude),
        longitude = COALESCE(p_longitude, longitude),
        city = COALESCE(p_city, city),
        state = COALESCE(p_state, state),
        last_heartbeat = NOW()
    WHERE id = v_session_id;
    RETURN v_session_id;
  ELSE
    INSERT INTO public.study_sessions (
      user_id, exam_slug, exam_name, subject, session_name,
      latitude, longitude, city, state, avatar_seed
    ) VALUES (
      v_user_id, p_exam_slug, p_exam_name, p_subject, p_session_name,
      p_latitude, p_longitude, p_city, p_state, v_avatar
    )
    RETURNING id INTO v_session_id;
    RETURN v_session_id;
  END IF;
END;
$$;

-- Function to end a study session
CREATE OR REPLACE FUNCTION public.end_study_session()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.study_sessions
  SET is_active = FALSE, ended_at = NOW()
  WHERE user_id = v_user_id AND is_active = TRUE;
  
  RETURN TRUE;
END;
$$;

-- Function to heartbeat
CREATE OR REPLACE FUNCTION public.heartbeat_session()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  UPDATE public.study_sessions
  SET last_heartbeat = NOW()
  WHERE user_id = v_user_id AND is_active = TRUE;
  
  RETURN FOUND;
END;
$$;

-- =====================================================
-- Enable Realtime
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_active_sessions_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_study_sessions() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_study_session(TEXT, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_study_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.heartbeat_session() TO authenticated;

-- Done!
SELECT 'Database schema setup complete!' as status;
