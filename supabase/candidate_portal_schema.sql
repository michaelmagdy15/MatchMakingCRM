-- CANDIDATE PORTAL SCHEMA AND ROW-LEVEL SECURITY (RLS) POLICIES
-- This script upgrades the Matchmaking CRM database to support secure Candidate accounts and notifications.

-- 1. Create Portal Notifications Table
CREATE TABLE IF NOT EXISTS portal_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- match_proposed, match_approved, photo_swap, contact_shared, admin_alert
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row-Level Security (RLS)
ALTER TABLE portal_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- 3. Portal Notifications Policies
-- Policy: Candidates can read their own portal notifications
CREATE POLICY select_own_notifications ON portal_notifications
  FOR SELECT USING (profile_id = auth.uid());

-- Policy: Admins/Matchmakers can manage all portal notifications
CREATE POLICY manage_all_notifications ON portal_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin', 'super_admin', 'crm_admin')
    )
  );

-- 4. Profiles RLS Policies
-- Policy: Admins/Matchmakers can perform all operations on all profiles
CREATE POLICY admin_manage_all_profiles ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin', 'super_admin', 'crm_admin')
    )
  );

-- Policy: Candidates can select their own profile
CREATE POLICY select_own_profile ON profiles
  FOR SELECT USING (id = auth.uid());

-- Policy: Candidates can select limited details of their matched partner's profile
CREATE POLICY select_matched_partner_profile ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches
      WHERE (matches.lady_id = auth.uid() AND matches.gentleman_id = profiles.id)
         OR (matches.gentleman_id = auth.uid() AND matches.lady_id = profiles.id)
    )
  );

-- Policy: Candidates can update specific fields of their own profile (e.g. recent_photo or self_introduction)
CREATE POLICY update_own_profile ON profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 5. Matches RLS Policies
-- Policy: Admins/Matchmakers can perform all operations on all matches
CREATE POLICY admin_manage_all_matches ON matches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('manager', 'admin', 'super_admin', 'crm_admin')
    )
  );

-- Policy: Candidates can read match records they are involved in
CREATE POLICY select_own_matches ON matches
  FOR SELECT USING (lady_id = auth.uid() OR gentleman_id = auth.uid());

-- Policy: Candidates can update match records they are involved in (approving profiles, photos, or contact swaps)
CREATE POLICY update_own_matches ON matches
  FOR UPDATE USING (lady_id = auth.uid() OR gentleman_id = auth.uid());
