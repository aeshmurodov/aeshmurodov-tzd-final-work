import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { getAuditStats } from "@/lib/audit"

export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const [documentsTotal, documentsByStatus, usersTotal, auditStats] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM documents`,
      sql`
        SELECT status, COUNT(*) as count
        FROM documents
        GROUP BY status
      `,
      sql`SELECT COUNT(*) as count FROM users`,
      getAuditStats(),
    ])

    const statusCounts: Record<string, number> = {}
    documentsByStatus.forEach((row: any) => {
      statusCounts[row.status] = Number.parseInt(row.count)
    })

    return NextResponse.json({
      documents: {
        total: Number.parseInt(documentsTotal[0].count),
        byStatus: statusCounts,
      },
      users: {
        total: Number.parseInt(usersTotal[0].count),
      },
      audit: auditStats,
    })
  } catch (error) {
    console.error("[v0] Get stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
