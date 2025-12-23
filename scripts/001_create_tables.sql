-- ЗЭДКД-Next Database Schema
-- Create tables for secure document management system

-- Users table with role-based access control
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table for tracking encrypted documents
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_hash VARCHAR(128) NOT NULL,
  encrypted_hash VARCHAR(128),
  signature VARCHAR(512),
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  encryption_algorithm VARCHAR(50),
  uploader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_size BIGINT,
  mime_type VARCHAR(100),
  encrypted_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs for compliance tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Encryption keys storage
CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,
  algorithm VARCHAR(50) NOT NULL DEFAULT 'GOST_34.10-2018',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_uploader ON documents(uploader_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_document ON audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_user ON encryption_keys(user_id);

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts with RBAC';
COMMENT ON TABLE documents IS 'Encrypted documents with GOST cryptography';
COMMENT ON TABLE audit_logs IS 'Complete audit trail for compliance';
COMMENT ON TABLE encryption_keys IS 'User cryptographic key pairs';
