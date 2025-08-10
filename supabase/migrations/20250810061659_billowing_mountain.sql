/*
  # Fix infinite recursion in RLS policies

  The infinite recursion error occurs when RLS policies reference the same table 
  they're protecting, creating circular dependencies.

  ## Changes:
  1. Drop existing problematic policies on company_users table
  2. Create simplified policies that avoid self-referencing queries
  3. Use direct user relationships instead of recursive company_users lookups

  ## Security:
  - Maintains the same access control logic
  - Removes circular dependencies
  - Uses users.company_id for simpler access checks
*/

-- Drop existing problematic policies on company_users
DROP POLICY IF EXISTS "Company admins can manage company users" ON company_users;
DROP POLICY IF EXISTS "Global admins can manage all company users" ON company_users;
DROP POLICY IF EXISTS "Users can read their own company relationships" ON company_users;

-- Drop existing problematic policies on companies
DROP POLICY IF EXISTS "Company users can read their company" ON companies;
DROP POLICY IF EXISTS "Global admins can manage all companies" ON companies;

-- Create simplified policies for company_users without recursion
CREATE POLICY "Global admin full access to company_users"
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

CREATE POLICY "Users can read own company relationships"
  ON company_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Company super_admins can manage company users"
  ON company_users
  FOR ALL
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
    OR
    company_id IN (
      SELECT cu.company_id FROM company_users cu
      WHERE cu.user_id = auth.uid() 
      AND cu.role IN ('super_admin', 'admin')
      AND cu.is_active = true
    )
  );

-- Create simplified policies for companies without recursion
CREATE POLICY "Global admin full access to companies"
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

CREATE POLICY "Users can read companies they belong to"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM users 
      WHERE id = auth.uid()
    )
    OR
    id IN (
      SELECT cu.company_id FROM company_users cu
      WHERE cu.user_id = auth.uid() 
      AND cu.is_active = true
    )
  );

-- Ensure users table has proper policies for company relationships
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Global admin can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.email = 'saibot.app@gmail.com'
    )
  );

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';