import { sql } from "./db"
import type { AuditLog } from "./db"

export async function logAudit(
  action: string,
  userId?: string,
  documentId?: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  await sql`
    INSERT INTO audit_logs (action, user_id, document_id, details, ip_address, user_agent)
    VALUES (${action}, ${userId || null}, ${documentId || null}, ${JSON.stringify(details || {})}, ${ipAddress || null}, ${userAgent || null})
  `
}

export async function getAuditLogs(limit = 50, documentId?: string): Promise<AuditLog[]> {
  if (documentId) {
    const result = await sql`
      SELECT a.*, u.username, u.full_name
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.document_id = ${documentId}
      ORDER BY a.timestamp DESC
      LIMIT ${limit}
    `
    return result as AuditLog[]
  }

  const result = await sql`
    SELECT a.*, u.username, u.full_name
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.timestamp DESC
    LIMIT ${limit}
  `

  return result as AuditLog[]
}

export async function getAuditStats(): Promise<{
  total: number
  today: number
  byAction: Record<string, number>
}> {
  const totalResult = await sql`SELECT COUNT(*) as count FROM audit_logs`
  const todayResult = await sql`
    SELECT COUNT(*) as count FROM audit_logs
    WHERE timestamp >= CURRENT_DATE
  `
  const byActionResult = await sql`
    SELECT action, COUNT(*) as count
    FROM audit_logs
    GROUP BY action
    ORDER BY count DESC
  `

  const byAction: Record<string, number> = {}
  byActionResult.forEach((row: any) => {
    byAction[row.action] = Number.parseInt(row.count)
  })

  return {
    total: Number.parseInt(totalResult[0].count),
    today: Number.parseInt(todayResult[0].count),
    byAction,
  }
}
