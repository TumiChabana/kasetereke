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
