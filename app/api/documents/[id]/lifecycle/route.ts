import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { logAudit } from "@/lib/audit"
import { DocumentStatus } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession()
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    
    const { id } = await params
    const body = await request.json()
    const action: "approve" | "to_pdek" | "declassify" | "destroy" = body.action
    const actDetails = body.actDetails || {}

    // --- РОЛЕВАЯ МАТРИЦА (RBAC) ---
    
    // 1. Утверждение (в исполнение) - Менеджер или Админ
    if (action === "approve") {
      if (user.role !== "manager" && user.role !== "admin") {
        return NextResponse.json({ error: "Только менеджер может утверждать документы" }, { status: 403 })
      }
    }

    // 2. Передача на ПДЭК - Менеджер или Админ
    if (action === "to_pdek") {
      if (user.role !== "manager" && user.role !== "admin") {
        return NextResponse.json({ error: "Недостаточно прав для передачи на ПДЭК" }, { status: 403 })
      }
    }

    // 3. Рассекречивание/Уничтожение - СТРОГО Админ (Глава комиссии)
    if (action === "declassify" || action === "destroy") {
      if (user.role !== "admin") {
        return NextResponse.json({ error: "Только администратор (глава комиссии) может подписывать акты уничтожения/рассекречивания" }, { status: 403 })
      }
    }

    // Получаем текущий документ
    const docResult = await sql`SELECT * FROM documents WHERE id = ${id} LIMIT 1`
    if (docResult.length === 0) return NextResponse.json({ error: "Document not found" }, { status: 404 })
    const doc = docResult[0]

    let newStatus: DocumentStatus = doc.status
    let updateQuery

    switch (action) {
      case "approve":
        newStatus = "execution"
        updateQuery = sql`UPDATE documents SET status = ${newStatus}, updated_at = NOW() WHERE id = ${id}`
        break

      case "to_pdek":
        newStatus = "pdek_review"
        updateQuery = sql`UPDATE documents SET status = ${newStatus}, pdek_date = NOW(), updated_at = NOW() WHERE id = ${id}`
        break

      case "declassify":
        newStatus = "declassified"
        updateQuery = sql`
          UPDATE documents 
          SET status = ${newStatus}, act_number = ${actDetails.number}, act_date = ${actDetails.date || new Date().toISOString()}, updated_at = NOW() 
          WHERE id = ${id}
        `
        break

      case "destroy":
        newStatus = "destroyed"
        updateQuery = sql`
          UPDATE documents 
          SET status = ${newStatus}, encrypted_data = NULL, substitution_sheet = TRUE, act_number = ${actDetails.number}, act_date = ${actDetails.date || new Date().toISOString()}, updated_at = NOW() 
          WHERE id = ${id}
        `
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    await updateQuery

    await logAudit("LIFECYCLE_CHANGE", user.id, id, {
      previous_status: doc.status,
      new_status: newStatus,
      action: action,
      act_details: actDetails,
      performer_role: user.role
    })

    return NextResponse.json({ success: true, status: newStatus })

  } catch (error) {
    console.error("[v0] Lifecycle error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}