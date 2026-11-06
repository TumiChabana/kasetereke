-- KaSetereke database schema (Neon Postgres)
-- Part 1 of 3: tables

CREATE TABLE districts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE places (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  district_id INTEGER NOT NULL REFERENCES districts(id),
  type TEXT NOT NULL CHECK (type IN ('stay', 'heritage')),
  price_band TEXT CHECK (price_band IN ('low', 'mid', 'high')),
  family_friendly BOOLEAN DEFAULT FALSE,
  needs_4x4 BOOLEAN DEFAULT FALSE,
  source TEXT
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id TEXT UNIQUE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'traveller'
    CHECK (role IN ('traveller', 'operator', 'admin', 'security_officer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Part 2 of 3: tables (continued)

ALTER TABLE places ADD COLUMN operator_id UUID REFERENCES profiles(id);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  place_id INTEGER NOT NULL REFERENCES places(id),
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL CHECK (guests > 0),
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_ref TEXT,
  record_hash TEXT,
  chain_tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (check_out > check_in)
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id),
  place_id INTEGER NOT NULL REFERENCES places(id),
  reviewer_pseudonym TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  comment_hash TEXT,
  chain_tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Part 3 of 5: row-level security (RLS) on, helper functions, first policies
-- Note: the Data API and its default grants were enabled from the Neon console.

ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE places    ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews   ENABLE ROW LEVEL SECURITY;

-- Helper: role of the signed-in user
CREATE FUNCTION app_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role FROM profiles WHERE auth_user_id = auth.user_id() $$;

-- Helper: profile id of the signed-in user
CREATE FUNCTION app_profile_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT id FROM profiles WHERE auth_user_id = auth.user_id() $$;

-- Public data: signed-in users can read
CREATE POLICY districts_read ON districts
  FOR SELECT TO authenticated USING (true);

CREATE POLICY places_read ON places
  FOR SELECT TO authenticated USING (true);

-- Profiles
CREATE POLICY profiles_select ON profiles FOR SELECT TO authenticated
  USING (auth_user_id = auth.user_id()
         OR app_role() IN ('admin','security_officer'));

CREATE POLICY profiles_insert ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.user_id() AND role = 'traveller');

CREATE POLICY profiles_update_own ON profiles FOR UPDATE TO authenticated
  USING (auth_user_id = auth.user_id())
  WITH CHECK (auth_user_id = auth.user_id() AND role = app_role());

CREATE POLICY profiles_update_admin ON profiles FOR UPDATE TO authenticated
  USING (app_role() = 'admin')
  WITH CHECK (app_role() = 'admin');

-- Places: admins and the owning operator can change places
CREATE POLICY places_insert ON places FOR INSERT TO authenticated
  WITH CHECK (app_role() = 'admin'
    OR (app_role() = 'operator' AND operator_id = app_profile_id()));

CREATE POLICY places_update ON places FOR UPDATE TO authenticated
  USING (app_role() = 'admin'
    OR (app_role() = 'operator' AND operator_id = app_profile_id()))
  WITH CHECK (app_role() = 'admin'
    OR (app_role() = 'operator' AND operator_id = app_profile_id()));

CREATE POLICY places_delete ON places FOR DELETE TO authenticated
  USING (app_role() = 'admin'
    OR (app_role() = 'operator' AND operator_id = app_profile_id()));

-- Part 4 of 5: bookings and reviews policies

-- Bookings
CREATE POLICY bookings_select ON bookings FOR SELECT TO authenticated
  USING (profile_id = app_profile_id()
    OR app_role() = 'admin'
    OR (app_role() = 'operator'
        AND place_id IN (SELECT id FROM places WHERE operator_id = app_profile_id())));

CREATE POLICY bookings_insert ON bookings FOR INSERT TO authenticated
  WITH CHECK (profile_id = app_profile_id() AND status = 'pending');

CREATE POLICY bookings_update ON bookings FOR UPDATE TO authenticated
  USING (profile_id = app_profile_id() OR app_role() = 'admin')
  WITH CHECK (profile_id = app_profile_id() OR app_role() = 'admin');

-- Only these columns can change after a booking is created
REVOKE UPDATE ON bookings FROM authenticated;
GRANT UPDATE (status, record_hash, chain_tx_hash) ON bookings TO authenticated;

-- Reviews: everyone signed in can read, only buyers can post
CREATE POLICY reviews_select ON reviews FOR SELECT TO authenticated USING (true);

CREATE POLICY reviews_insert ON reviews FOR INSERT TO authenticated
  WITH CHECK (profile_id = app_profile_id()
    AND EXISTS (SELECT 1 FROM bookings b
                WHERE b.profile_id = app_profile_id()
                  AND b.place_id = reviews.place_id
                  AND b.status IN ('confirmed','completed')));

CREATE POLICY reviews_update ON reviews FOR UPDATE TO authenticated
  USING (profile_id = app_profile_id())
  WITH CHECK (profile_id = app_profile_id());

-- Rating and comment are frozen after posting; only the hash columns can change
REVOKE UPDATE ON reviews FROM authenticated;
GRANT UPDATE (comment_hash, chain_tx_hash) ON reviews TO authenticated;

CREATE POLICY reviews_delete ON reviews FOR DELETE TO authenticated
  USING (profile_id = app_profile_id() OR app_role() = 'admin');

