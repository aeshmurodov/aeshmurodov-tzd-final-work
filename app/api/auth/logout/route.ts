import { NextResponse } from "next/server"
import { getSession, destroySession } from "@/lib/session"
import { logAudit } from "@/lib/audit"

export async function POST() {
  try {
    const user = await getSession()

    if (user) {
      await logAudit("LOGOUT", user.id)
    }

    await destroySession()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[log] Logout error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
