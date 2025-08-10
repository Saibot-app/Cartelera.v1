/*
  # Fix infinite recursion in company_users RLS policies

  1. Problem
    - Circular dependency between users and company_users policies
    - company_users policies query users table, which triggers users policies
    - This creates infinite recursion loop

  2. Solution
    - Drop all existing problematic policies
    - Create simple, direct policies using auth.uid() only
    - Avoid complex subqueries that could trigger recursion
    - Use direct foreign key relationships without additional table lookups

  3. New Policy Structure
    - Global admin gets full access via auth.email()
    - Users can only see/manage their own company relationships
    - No recursive table lookups
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Company super_admins can manage company users" ON company_users;
DROP POLICY IF EXISTS "Global admin full access to company_users" ON company_users;
DROP POLICY IF EXISTS "Users can read own company relationships" ON company_users;
DROP POLICY IF EXISTS "company_users_select_by_playlist_owner" ON company_users;
DROP POLICY IF EXISTS "company_users_insert_by_playlist_owner" ON company_users;
DROP POLICY IF EXISTS "company_users_update_by_playlist_owner" ON company_users;
DROP POLICY IF EXISTS "company_users_delete_by_playlist_owner" ON company_users;

-- Drop problematic users policies that reference company_users
DROP POLICY IF EXISTS "Global admin can read all users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Create simple, non-recursive policies for company_users
CREATE POLICY "company_users_global_admin_access" ON company_users
    FOR ALL TO authenticated
    USING (auth.email() = 'saibot.app@gmail.com');

CREATE POLICY "company_users_own_records_select" ON company_users
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "company_users_own_records_insert" ON company_users
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "company_users_own_records_update" ON company_users
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "company_users_own_records_delete" ON company_users
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- Create simple, non-recursive policies for users
CREATE POLICY "users_global_admin_access" ON users
    FOR ALL TO authenticated
    USING (auth.email() = 'saibot.app@gmail.com');

CREATE POLICY "users_own_profile_select" ON users
    FOR SELECT TO authenticated
    USING (id = auth.uid());

CREATE POLICY "users_own_profile_update" ON users
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Also drop and recreate companies policies to ensure no recursion
DROP POLICY IF EXISTS "Global admin full access to companies" ON companies;
DROP POLICY IF EXISTS "Users can read companies they belong to" ON companies;

CREATE POLICY "companies_global_admin_access" ON companies
    FOR ALL TO authenticated
    USING (auth.email() = 'saibot.app@gmail.com');

CREATE POLICY "companies_user_company_access" ON companies
    FOR SELECT TO authenticated
    USING (
        id IN (
            SELECT company_id 
            FROM company_users 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Refresh schema cache to apply changes
NOTIFY pgrst, 'reload schema';