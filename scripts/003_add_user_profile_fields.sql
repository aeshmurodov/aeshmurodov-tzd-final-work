-- Add profile fields to users table if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update existing users with default data
UPDATE users 
SET 
  full_name = CASE username
    WHEN 'admin' THEN 'Администратор Системы'
    WHEN 'manager' THEN 'Менеджер Отдела'
    WHEN 'user' THEN 'Пользователь Системы'
    ELSE username
  END,
  email = username || '@zedkd.local',
  updated_at = CURRENT_TIMESTAMP
WHERE full_name IS NULL;
