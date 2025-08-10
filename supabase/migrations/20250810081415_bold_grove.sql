/*
  # Fix Edge Function Permissions and Policies
  
  This script ensures the Edge Function can properly create and manage users
  by setting up the correct permissions and policies.
*/

-- Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is global admin
CREATE OR REPLACE FUNCTION is_global_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT email() = 'saibot.app@gmail.com'),
    FALSE
  );
END;
$$;

-- Helper function to get current user email
CREATE OR REPLACE FUNCTION email()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt() ->> 'email',
    ''
  );
END;
$$;

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION uid()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() ->> 'sub')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
END;
$$;

-- **CRITICAL: Grant service_role access to all tables**
GRANT ALL ON users TO service_role;
GRANT ALL ON companies TO service_role;
GRANT ALL ON company_users TO service_role;
GRANT ALL ON auth.users TO service_role;

-- Grant usage on all sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- **USERS TABLE POLICIES**

-- Drop existing policies
DROP POLICY IF EXISTS "users_global_admin_access" ON users;
DROP POLICY IF EXISTS "users_own_profile_select" ON users;
DROP POLICY IF EXISTS "users_own_profile_update" ON users;

-- Global admin has full access
CREATE POLICY "users_global_admin_access"
  ON users FOR ALL 
  TO authenticated
  USING (email() = 'saibot.app@gmail.com');

-- Users can read/update their own profile
CREATE POLICY "users_own_profile_select"
  ON users FOR SELECT 
  TO authenticated
  USING (id = uid());

CREATE POLICY "users_own_profile_update"
  ON users FOR UPDATE 
  TO authenticated
  USING (id = uid())
  WITH CHECK (id = uid());

-- **COMPANIES TABLE POLICIES**

-- Drop existing policies
DROP POLICY IF EXISTS "companies_global_admin_access" ON companies;
DROP POLICY IF EXISTS "companies_user_company_access" ON companies;

-- Global admin has full access
CREATE POLICY "companies_global_admin_access"
  ON companies FOR ALL 
  TO authenticated
  USING (email() = 'saibot.app@gmail.com');

-- Users can read their own company
CREATE POLICY "companies_user_company_access"
  ON companies FOR SELECT 
  TO authenticated
  USING (id IN (
    SELECT company_users.company_id 
    FROM company_users 
    WHERE company_users.user_id = uid() 
    AND company_users.is_active = true
  ));

-- **COMPANY_USERS TABLE POLICIES**

-- Drop existing policies
DROP POLICY IF EXISTS "company_users_global_admin_access" ON company_users;
DROP POLICY IF EXISTS "company_users_own_records_select" ON company_users;
DROP POLICY IF EXISTS "company_users_own_records_insert" ON company_users;
DROP POLICY IF EXISTS "company_users_own_records_update" ON company_users;
DROP POLICY IF EXISTS "company_users_own_records_delete" ON company_users;

-- Global admin has full access
CREATE POLICY "company_users_global_admin_access"
  ON company_users FOR ALL 
  TO authenticated
  USING (email() = 'saibot.app@gmail.com');

-- Users can manage their own company relationships
CREATE POLICY "company_users_own_records_select"
  ON company_users FOR SELECT 
  TO authenticated
  USING (user_id = uid());

CREATE POLICY "company_users_own_records_insert"
  ON company_users FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = uid());

CREATE POLICY "company_users_own_records_update"
  ON company_users FOR UPDATE 
  TO authenticated
  USING (user_id = uid())
  WITH CHECK (user_id = uid());

CREATE POLICY "company_users_own_records_delete"
  ON company_users FOR DELETE 
  TO authenticated
  USING (user_id = uid());

-- **ENSURE TRIGGER FUNCTIONS EXIST**

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to set created_by field
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by = uid();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers if they don't exist
DO $$ 
BEGIN
    -- Users table
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at
            BEFORE UPDATE ON users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Companies table  
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_companies_updated_at') THEN
        CREATE TRIGGER update_companies_updated_at
            BEFORE UPDATE ON companies
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Company_users table
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_company_users_updated_at') THEN
        CREATE TRIGGER update_company_users_updated_at
            BEFORE UPDATE ON company_users
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- **VERIFICATION QUERIES** (Run these to check everything is working)

-- Check if policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('users', 'companies', 'company_users')
ORDER BY tablename, policyname;

-- Check grants to service_role
SELECT table_name, privilege_type 
FROM information_schema.table_privileges 
WHERE grantee = 'service_role' 
AND table_name IN ('users', 'companies', 'company_users');

-- Test helper functions
SELECT 
  'Global admin check' AS test,
  is_global_admin() AS result;

SELECT 
  'Email function' AS test,
  email() AS result;

SELECT 
  'UID function' AS test,
  uid() AS result;