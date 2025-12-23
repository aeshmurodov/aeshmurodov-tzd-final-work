import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { logAudit } from "@/lib/audit"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const documentId = params.id

    // Get document details before deletion for audit log
    const docResult = await sql`
      SELECT * FROM documents WHERE id = ${documentId}
    `

    if (docResult.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const document = docResult[0]

    // Check permissions - only uploader, manager, or admin can delete
    if (user.role !== "admin" && user.role !== "manager" && document.uploader_id !== user.id) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Delete document
    await sql`DELETE FROM documents WHERE id = ${documentId}`

    // Log the deletion
    await logAudit("DOCUMENT_DELETE", user.id, documentId, {
      filename: document.filename,
      status: document.status,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete document error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
