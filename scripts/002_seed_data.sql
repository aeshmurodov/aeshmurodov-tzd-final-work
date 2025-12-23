-- Seed initial data for ЗЭДКД-Next system
-- Password: admin123 (hashed with bcrypt)

INSERT INTO users (username, password_hash, role, email, full_name) VALUES
('admin', '$2a$10$rXKJ5JZhZQXZ5P8N5.P9hO0JZ5ZQXz5P8N5.P9hO0JZ5ZQXz5P8N5.', 'admin', 'admin@zedkd.ru', 'Администратор Системы'),
('manager', '$2a$10$rXKJ5JZhZQXZ5P8N5.P9hO0JZ5ZQXz5P8N5.P9hO0JZ5ZQXz5P8N5.', 'manager', 'manager@zedkd.ru', 'Менеджер Документов'),
('user', '$2a$10$rXKJ5JZhZQXZ5P8N5.P9hO0JZ5ZQXz5P8N5.P9hO0JZ5ZQXz5P8N5.', 'user', 'user@zedkd.ru', 'Пользователь Системы')
ON CONFLICT (username) DO NOTHING;

-- Add initial audit log entry
INSERT INTO audit_logs (action, details) VALUES
('SYSTEM_INIT', '{"message": "ЗЭДКД-Next system initialized", "version": "1.0.0"}');
