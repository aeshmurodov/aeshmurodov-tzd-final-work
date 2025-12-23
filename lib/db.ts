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

// Расширенный список статусов согласно схеме
export type DocumentStatus = 
  | "draft"         // Создание (1)
  | "review"        // Согласование
  | "approved"      // Утверждение
  | "execution"     // Исполнение
  | "pdek_review"   // Заседание ПДЭК (через 4 года)
  | "declassified"  // Рассекречено (Передача в открытое делопроизводство)
  | "destroyed"     // Уничтожено (Акт об уничтожении)
  | "signed"        // Legacy (оставим для совместимости)
  | "encrypted"     // Legacy
  | "verified"      // Legacy
  | "tampered"      // Security check

export interface Document {
  id: string
  filename: string
  original_hash: string
  encrypted_hash?: string
  signature?: string
  status: DocumentStatus
  encryption_algorithm?: string
  uploader_id: string
  file_size?: number
  mime_type?: string
  encrypted_data?: string // При статусе destroyed здесь будет NULL
  created_at: Date
  updated_at: Date
  
  // Новые поля жизненного цикла
  retention_years?: number
  pdek_date?: Date
  act_number?: string
  act_date?: Date
  substitution_sheet?: boolean
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