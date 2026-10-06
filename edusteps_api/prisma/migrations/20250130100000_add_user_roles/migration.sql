-- Migration: Add user roles
-- Add role field to users table

-- Create role enum
CREATE TYPE user_role_enum AS ENUM ('admin', 'teacher', 'student', 'parent', 'staff');

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role user_role_enum DEFAULT 'student';

-- Create index for role
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have default role
UPDATE users SET role = 'admin' WHERE role IS NULL;

COMMENT ON COLUMN users.role IS 'User role: admin, teacher, student, parent, staff';
