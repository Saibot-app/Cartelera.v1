/*
  # Fix schedules table RLS policy for insert operations

  1. Security Updates
    - Drop existing problematic insert policy for users
    - Create new comprehensive insert policy that allows authenticated users to create their own schedules
    - Ensure created_by field is automatically set to current user

  2. Changes
    - Allow any authenticated user to insert schedules where they are the creator
    - Maintain existing admin/editor policies for full access
*/

-- Drop the existing user insert policy that might be causing conflicts
DROP POLICY IF EXISTS "Users can insert own schedules" ON schedules;

-- Create a new policy that allows authenticated users to insert their own schedules
CREATE POLICY "Authenticated users can create own schedules"
  ON schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());