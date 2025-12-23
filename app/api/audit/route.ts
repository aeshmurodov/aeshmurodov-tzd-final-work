import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getAuditLogs } from "@/lib/audit"

export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (user.role !== "admin" && user.role !== "manager") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const logs = await getAuditLogs(100)

    return NextResponse.json({ logs })
  } catch (error) {
    console.error("[v0] Get audit logs error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
