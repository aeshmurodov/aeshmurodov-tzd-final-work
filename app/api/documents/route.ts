import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { GOSTCrypto } from "@/lib/crypto"
import { logAudit } from "@/lib/audit"
import type { Document } from "@/lib/db"

export async function GET() {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const documents = await sql`
      SELECT d.*, u.username as uploader_username, u.full_name as uploader_name
      FROM documents d
      JOIN users u ON d.uploader_id = u.id
      ORDER BY d.created_at DESC
    `

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("[v0] Get documents error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { filename, fileData, mimeType } = await request.json()

    if (!filename || !fileData) {
      return NextResponse.json({ error: "Filename and file data required" }, { status: 400 })
    }

    // Calculate GOST hash (Streebog-512)
    const originalHash = GOSTCrypto.streebog512(fileData)

    // Store document with draft status
    const result = await sql`
      INSERT INTO documents (
        filename, original_hash, status, uploader_id, 
        file_size, mime_type, encrypted_data
      )
      VALUES (
        ${filename}, ${originalHash}, 'draft', ${user.id},
        ${fileData.length}, ${mimeType || "application/octet-stream"}, ${fileData}
      )
      RETURNING *
    `

    const document = result[0] as Document

    await logAudit("DOCUMENT_UPLOAD", user.id, document.id, {
      filename,
      hash: originalHash,
    })

    return NextResponse.json({ document })
  } catch (error) {
    console.error("[v0] Upload document error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
