import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL)

// Types for database records
export interface User {
  id: string
  username: string
  password_hash: string
  role: "admin" | "manager" | "user"
  email: string
  full_name?: string
  created_at: Date
  updated_at: Date
}

export interface Document {
  id: string
  filename: string
  original_hash: string
  encrypted_hash?: string
  signature?: string
  status: "draft" | "signed" | "encrypted" | "verified"
  encryption_algorithm?: string
  uploader_id: string
  file_size?: number
  mime_type?: string
  encrypted_data?: string
  created_at: Date
  updated_at: Date
}

export interface AuditLog {
  id: string
  action: string
  user_id?: string
  document_id?: string
  details?: Record<string, any>
  ip_address?: string
  user_agent?: string
  timestamp: Date
}

export interface EncryptionKey {
  id: string
  user_id: string
  public_key: string
  private_key_encrypted: string
  algorithm: string
  created_at: Date
  expires_at?: Date
}
