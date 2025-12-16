/**
 * Supabase Setup Script
 * 
 * This script sets up the required database schema for the Live Study Map feature.
 * Run with: node scripts/setup-supabase.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ADMIN_KEY = process.env.SUPABASE_ADMIN_KEYS;

if (!SUPABASE_URL || !SUPABASE_ADMIN_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ADMIN_KEYS in .env');
  process.exit(1);
}

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// SQL to create the schema
const setupSQL = `
-- =====================================================
-- Live Study Map Database Schema
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- =====================================================
-- Study Sessions Table
-- Stores active and historical study sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  exam_slug TEXT,
  exam_name TEXT,
  subject TEXT, -- The specific subject being studied
  session_name TEXT, -- Session name from timekeeper
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  avatar_seed TEXT NOT NULL, -- Seed for DiceBear avatar generation
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_study_sessions_active 
  ON public.study_sessions(is_active) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_study_sessions_heartbeat 
  ON public.study_sessions(last_heartbeat) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_study_sessions_location 
  ON public.study_sessions(latitude, longitude) 
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_study_sessions_user 
  ON public.study_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_study_sessions_exam 
  ON public.study_sessions(exam_slug) 
  WHERE is_active = TRUE;

-- =====================================================
-- User Locations Table (cached from IP geolocation)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  ip_address INET,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  region_code TEXT,
  timezone TEXT,
  isp TEXT,
  accuracy_radius INT, -- in km
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_locations_user 
  ON public.user_locations(user_id);

-- =====================================================
-- Row Level Security Policies
-- =====================================================
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Study Sessions Policies
DROP POLICY IF EXISTS "Anyone can view active sessions" ON public.study_sessions;
CREATE POLICY "Anyone can view active sessions"
  ON public.study_sessions FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "Users can insert their own sessions" ON public.study_sessions;
CREATE POLICY "Users can insert their own sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sessions" ON public.study_sessions;
CREATE POLICY "Users can update their own sessions"
  ON public.study_sessions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sessions" ON public.study_sessions;
CREATE POLICY "Users can delete their own sessions"
  ON public.study_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- User Locations Policies
DROP POLICY IF EXISTS "Users can view their own location" ON public.user_locations;
CREATE POLICY "Users can view their own location"
  ON public.user_locations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own location" ON public.user_locations;
CREATE POLICY "Users can insert their own location"
  ON public.user_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own location" ON public.user_locations;
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
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Generate avatar seed if not provided
  v_avatar := COALESCE(p_avatar_seed, v_user_id::TEXT);
  
  -- Try to find existing active session
  SELECT id INTO v_session_id
  FROM public.study_sessions
  WHERE user_id = v_user_id
    AND is_active = TRUE
  LIMIT 1;
  
  IF v_session_id IS NOT NULL THEN
    -- Update existing session
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
    -- Create new session
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
  SET is_active = FALSE,
      ended_at = NOW()
  WHERE user_id = v_user_id
    AND is_active = TRUE;
  
  RETURN TRUE;
END;
$$;

-- Function to heartbeat (keep session alive)
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
  WHERE user_id = v_user_id
    AND is_active = TRUE;
  
  RETURN FOUND;
END;
$$;

-- =====================================================
-- Enable Realtime for study_sessions
-- =====================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_active_sessions_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_study_sessions() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_study_session(TEXT, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_study_session() TO authenticated;
GRANT EXECUTE ON FUNCTION public.heartbeat_session() TO authenticated;

-- Done!
SELECT 'Database schema setup complete!' as status;
`;

async function runSetup() {
  console.log('🚀 Setting up Supabase database schema...\n');
  console.log(`📡 Connecting to: ${SUPABASE_URL}\n`);
  
  try {
    // Run the SQL setup
    const { data, error } = await supabase.rpc('exec_sql', { sql: setupSQL });
    
    if (error) {
      // If exec_sql doesn't exist, we need to run statements individually
      console.log('⚠️  exec_sql not available, running via REST API...\n');
      
      // Use the REST API directly
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ADMIN_KEY,
          'Authorization': `Bearer ${SUPABASE_ADMIN_KEY}`,
        },
        body: JSON.stringify({ query: setupSQL }),
      });
      
      if (!response.ok) {
        // Try using the SQL endpoint directly
        console.log('⚠️  Trying direct SQL execution...\n');
        
        // Split SQL into individual statements and run them
        const statements = setupSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        console.log(`📝 Running ${statements.length} SQL statements...\n`);
        
        for (let i = 0; i < Math.min(statements.length, 5); i++) {
          console.log(`  Statement ${i + 1}: ${statements[i].substring(0, 50)}...`);
        }
        console.log('  ...\n');
        
        console.log('⚠️  Direct SQL execution requires Supabase CLI or Dashboard.\n');
        console.log('📋 Please run the following SQL in your Supabase Dashboard SQL Editor:\n');
        console.log('=' .repeat(60));
        console.log(setupSQL);
        console.log('=' .repeat(60));
        console.log('\n✅ Copy the SQL above and paste it in:');
        console.log('   https://supabase.com/dashboard/project/ivmobluuegkikmbwbfhe/sql/new\n');
        return;
      }
      
      console.log('✅ Schema created successfully!\n');
    } else {
      console.log('✅ Schema created successfully!\n');
      console.log(data);
    }
    
    // Test the connection
    const { data: testData, error: testError } = await supabase
      .from('study_sessions')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  Table may not exist yet. Please run the SQL in the Dashboard.\n');
    } else {
      console.log('✅ Database tables verified!\n');
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📋 Please run the SQL manually in your Supabase Dashboard:\n');
    console.log(setupSQL);
  }
}

// Run the setup
runSetup();
