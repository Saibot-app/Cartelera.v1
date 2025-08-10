/*
  # Create multi-empresa schema

  1. New Tables
    - `companies`
      - `id` (uuid, primary key)  
      - `name` (text, company name)
      - `company_id` (text, unique identifier)
      - `logo_url` (text, logo URL)
      - `primary_color`, `secondary_color`, `accent_color` (text, branding colors)
      - `is_active` (boolean, company status)
      - `subscription_plan` (text, plan type)
      - `max_users`, `max_screens` (integer, limits)
      - `created_at`, `updated_at` (timestamps)

    - `company_users` 
      - `user_id` (uuid, foreign key to users)
      - `company_id` (uuid, foreign key to companies) 
      - `role` (enum: super_admin, admin, creator, audience)
      - `is_active` (boolean, user status in company)
      - `created_at`, `updated_at` (timestamps)

  2. Security
    - Enable RLS on both tables
    - Add policies for proper access control
    
  3. Changes
    - Add `company_id` column to existing tables
    - Create foreign key relationships
    - Add update triggers
*/

-- Create company_user_role enum
CREATE TYPE company_user_role AS ENUM ('super_admin', 'admin', 'creator', 'audience');

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_id text UNIQUE NOT NULL,
  logo_url text,
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#1F2937', 
  accent_color text DEFAULT '#10B981',
  is_active boolean DEFAULT true,
  subscription_plan text DEFAULT 'basic',
  max_users integer DEFAULT 5,
  max_screens integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create company_users table
CREATE TABLE IF NOT EXISTS company_users (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  role company_user_role DEFAULT 'audience',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, company_id)
);

-- Add company_id to existing tables if not exists
DO $$
BEGIN
  -- Add company_id to users table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE users ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE SET NULL;
  END IF;

  -- Add company_id to screens table  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'screens' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE screens ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;

  -- Add company_id to content table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content' AND column_name = 'company_id'  
  ) THEN
    ALTER TABLE content ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;

  -- Add company_id to playlists table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'playlists' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE playlists ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;

  -- Add company_id to schedules table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'schedules' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE schedules ADD COLUMN company_id uuid REFERENCES companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Global admins can manage all companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.email = 'saibot.app@gmail.com'
    )
  );

CREATE POLICY "Company users can read their company"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users
      WHERE company_users.company_id = companies.id
      AND company_users.user_id = auth.uid()
      AND company_users.is_active = true
    )
  );

-- Company users policies  
CREATE POLICY "Global admins can manage all company users"
  ON company_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.email = 'saibot.app@gmail.com' 
    )
  );

CREATE POLICY "Company admins can manage company users"
  ON company_users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM company_users AS cu
      WHERE cu.company_id = company_users.company_id
      AND cu.user_id = auth.uid()
      AND cu.role IN ('super_admin', 'admin')
      AND cu.is_active = true
    )
  );

CREATE POLICY "Users can read their own company relationships"
  ON company_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_companies_active ON companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_company_id ON companies(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_role ON company_users(role);

-- Create update triggers for timestamps
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_users_updated_at  
  BEFORE UPDATE ON company_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();