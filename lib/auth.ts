import { sql } from "./db"
import { hashPassword } from "./crypto"
import type { User } from "./db"

export async function createUser(
  username: string,
  password: string,
  email: string,
  role = "user",
  fullName?: string,
): Promise<User> {
  const passwordHash = hashPassword(password)

  const result = await sql`
    INSERT INTO users (username, password_hash, email, role, full_name)
    VALUES (${username}, ${passwordHash}, ${email}, ${role}, ${fullName})
    RETURNING *
  `

  return result[0] as User
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE username = ${username} LIMIT 1

  `
  console.log(result)
  return (result[0] as User) || null
}

import { verifyPassword } from "./crypto"

export async function verifyUser(
  username: string,
  password: string
): Promise<User | null> {
  const user = await getUserByUsername(username)

  if (!user) {
    return null
  }

  const isValid = verifyPassword(password, user.password_hash)
  if (!isValid) {
    return null
  }

  return user
}


export async function getUserById(id: string): Promise<User | null> {
  const result = await sql`
    SELECT * FROM users WHERE id = ${id} LIMIT 1
  `

  return (result[0] as User) || null
}

export async function listUsers(): Promise<User[]> {
  const result = await sql`
    SELECT id, username, email, role, full_name, created_at
    FROM users
    ORDER BY created_at DESC
  `

  return result as User[]
}

export function checkPermission(user: User, requiredRole: "admin" | "manager" | "user"): boolean {
  const roleHierarchy = { admin: 3, manager: 2, user: 1 }
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
}
