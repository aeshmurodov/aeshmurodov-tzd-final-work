import { type NextRequest, NextResponse } from "next/server"
import { verifyUser, createUser } from "@/lib/auth"
import { createSession } from "@/lib/session"
import { logAudit } from "@/lib/audit"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })
    }

    const user = await verifyUser(username, password)
    
    console.log(user)

    if (!user) {
      await logAudit("LOGIN_FAILED", undefined, undefined, { username })
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    await createSession(user.id)
    await logAudit("LOGIN_SUCCESS", user.id, undefined, { username })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
      },
    })
  } catch (error) {
    console.error("[log] Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
