import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { sql } from "@/lib/db"
import { logAudit } from "@/lib/audit"

export async function PUT(request: NextRequest) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Не авторизован" }, { status: 401 })
    }

    const { full_name, email, phone } = await request.json()

    // Update user profile
    await sql`
      UPDATE users
      SET 
        full_name = ${full_name},
        email = ${email},
        phone = ${phone},
        updated_at = NOW()
      WHERE id = ${user.id}
    `

    // Log audit event
    // Correct signature: action, userId, documentId, details
    await logAudit("PROFILE_UPDATE", user.id, undefined, {
      full_name,
      email,
      phone,
    })
    
    return NextResponse.json({
      success: true,
      message: "Профиль обновлен",
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Ошибка обновления профиля" }, { status: 500 })
  }
}
