/*
  # Fix infinite recursion in users table RLS policy

  1. Problem
    - The "Global admin can read all users" policy was querying the `users` table from within itself
    - This created infinite recursion when evaluating the policy

  2. Solution
    - Replace the recursive policy with a direct auth.email() check
    - Use auth.email() which doesn't trigger RLS policies
    - Maintain the same security access for global admin

  3. Changes
    - Drop the problematic policy that caused recursion
    - Create a new policy using auth.email() for global admin access
    - Keep other policies unchanged
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Global admin can read all users" ON users;

-- Create a new global admin policy using auth.email() to avoid recursion
CREATE POLICY "Global admin can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.email() = 'saibot.app@gmail.com');

-- Refresh the schema cache to apply changes
NOTIFY pgrst, 'reload schema';