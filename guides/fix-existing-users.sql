-- Fix existing users who don't have profiles
-- Run this if you have users in auth.users but not in user_profiles

INSERT INTO user_profiles (id, username, is_admin)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'username', 'user_' || substr(u.id::text, 1, 8)) as username,
  false as is_admin
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Verify the fix worked
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'username' as username_from_metadata,
  up.username as username_in_profile,
  up.is_admin
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
ORDER BY u.created_at DESC;

