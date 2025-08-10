/*
  # Fix playlist creation permissions

  1. Security Policy Updates
    - Add policy to allow authenticated users to create their own playlists
    - Maintains existing admin/editor permissions for managing all playlists
    - Users can only create playlists for themselves (created_by = auth.uid())

  2. Changes Made
    - Added "Users can insert own playlists" policy
    - Allows INSERT for authenticated users where created_by = auth.uid()
*/

-- Add policy for users to create their own playlists
CREATE POLICY "Users can insert own playlists"
  ON playlists
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());