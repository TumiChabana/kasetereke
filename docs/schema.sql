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
