-- SUPABASE & POSTGRESQL DATABASE SCHEMA FOR MATCHMAKING CRM

-- 1. ENUMS AND CUSTOM TYPES
CREATE TYPE gender_type AS ENUM ('Lady', 'Gentleman');

CREATE TYPE profile_status AS ENUM ('Pending Review', 'Approved', 'Rejected', 'Hold');

CREATE TYPE match_status AS ENUM (
  'PENDING_PROFILE_APPROVAL',
  'PENDING_PHOTO_APPROVAL',
  'PENDING_CONTACT_SHARE',
  'MATCH_ACTIVE',
  'PENDING_FEEDBACK',
  'UNMATCHED'
);

CREATE TYPE user_role AS ENUM ('manager', 'rep', 'admin', 'super_admin', 'crm_admin');

-- 2. USERS TABLE (System Admins & Matchmakers)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role user_role DEFAULT 'rep',
  sales_target NUMERIC DEFAULT 0,
  can_delete_payments BOOLEAN DEFAULT FALSE,
  can_view_global_dashboard BOOLEAN DEFAULT TRUE,
  can_access_settings_and_history BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. PROFILES TABLE (Candidates / Members)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL, -- unique sequential code e.g. L101, G101
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(100),
  email VARCHAR(255),
  gender gender_type NOT NULL,
  status profile_status DEFAULT 'Pending Review',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  age INT,
  location_of_residence VARCHAR(255),
  height VARCHAR(50),
  university_field_of_study TEXT,
  current_job VARCHAR(255),
  marital_status VARCHAR(100),
  have_children VARCHAR(100),
  children_details TEXT,
  religion VARCHAR(100),
  religious_denomination VARCHAR(100),
  preferred_religious_denomination VARCHAR(100),
  hijab_preference VARCHAR(100),
  pray_regularly VARCHAR(100),
  religious_commitment_level VARCHAR(100),
  preferred_age_range VARCHAR(100),
  open_to_long_distance VARCHAR(100),
  willing_to_relocate VARCHAR(100),
  partner_preferences TEXT,
  self_introduction TEXT,
  smoke_or_drink VARCHAR(100),
  facebook_link TEXT,
  prefer_older_or_younger VARCHAR(100),
  recent_photo TEXT, -- URL or base64 photo
  rejection_reason TEXT,
  are_you_gucian VARCHAR(50),
  guc_id VARCHAR(50),
  
  -- Men-only fields
  believe_duty_to_provide VARCHAR(255),
  are_okay_with_wife_working VARCHAR(255),
  current_financial_status TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. MATCHES TABLE (Pair interactions and state tracking)
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lady_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  gentleman_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lady_code VARCHAR(50) NOT NULL,
  gentleman_code VARCHAR(50) NOT NULL,
  status match_status DEFAULT 'PENDING_PROFILE_APPROVAL',
  
  -- Phase 1 Text Approval
  lady_approved_profile BOOLEAN DEFAULT FALSE,
  gentleman_approved_profile BOOLEAN DEFAULT FALSE,
  
  -- Phase 2 Photo Approval
  lady_approved_photo BOOLEAN DEFAULT FALSE,
  gentleman_approved_photo BOOLEAN DEFAULT FALSE,
  
  -- Phase 3 Contact Share Approval
  lady_approved_contact BOOLEAN DEFAULT FALSE,
  gentleman_approved_contact BOOLEAN DEFAULT FALSE,

  responsible_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  responsible_admin_name VARCHAR(255),
  notes TEXT,
  
  -- Sequential progress checks
  first_check VARCHAR(100) DEFAULT 'Pending',
  second_check VARCHAR(100) DEFAULT 'Pending',
  third_check VARCHAR(100) DEFAULT 'Pending',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_match_pair UNIQUE (lady_id, gentleman_id)
);

-- 5. COMMENTS TABLE (CRM Internal Comments on Profiles)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  author VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. INTERACTIONS TABLE (CRM Interaction Logs)
CREATE TABLE IF NOT EXISTS interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL, -- Call, WhatsApp, Email, Visit
  outcome VARCHAR(100) NOT NULL,
  notes TEXT,
  next_follow_up TIMESTAMP WITH TIME ZONE,
  author VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TASKS TABLE (Admin Tasks)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, In Progress, Completed
  priority VARCHAR(50) DEFAULT 'Medium', -- Low, Medium, High
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, REVEAL
  entity_type VARCHAR(50) NOT NULL, -- PROFILE, MATCH, PAYMENT, TASK, etc.
  entity_id VARCHAR(100) NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TRIGGERS FOR UPDATED_AT TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE
ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE
ON matches FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE
ON tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- TRIGGER TO AUTOMATICALLY SET RESPONSIBLE MATCHMAKER ON INSERT FROM AUTH SESSION
CREATE OR REPLACE FUNCTION set_match_responsible_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-assign the authenticated session user ID if not provided
  IF NEW.responsible_admin_id IS NULL AND auth.uid() IS NOT NULL THEN
    NEW.responsible_admin_id := auth.uid();
  END IF;

  -- Auto-resolve their name from the trusted users table
  IF NEW.responsible_admin_id IS NOT NULL THEN
    SELECT name INTO NEW.responsible_admin_name
    FROM users
    WHERE id = NEW.responsible_admin_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER before_match_insert
BEFORE INSERT ON matches
FOR EACH ROW
EXECUTE FUNCTION set_match_responsible_admin();

-- 10. INDEXES FOR MATCHES AND PROFILES
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_code ON profiles(code);
CREATE INDEX IF NOT EXISTS idx_matches_lady_id ON matches(lady_id);
CREATE INDEX IF NOT EXISTS idx_matches_gentleman_id ON matches(gentleman_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
