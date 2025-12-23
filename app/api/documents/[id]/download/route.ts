import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { logAudit, getAuditLogs } from "@/lib/audit"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const mode = searchParams.get("mode") || "file" // 'file' | 'metadata'

    // Get document details
    const docResult = await sql`
      SELECT d.*, u.username as uploader_username, u.full_name as uploader_name
      FROM documents d
      JOIN users u ON d.uploader_id = u.id
      WHERE d.id = ${id}
      LIMIT 1
    `

    if (docResult.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const document = docResult[0]

    // Check permissions (admin, manager, or owner)
    if (user.role !== "admin" && user.role !== "manager" && document.uploader_id !== user.id) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // ---------------------------------------------------------
    // Mode: Metadata (JSON with signatures, hash, history)
    // ---------------------------------------------------------
    if (mode === "metadata") {
      const history = await getAuditLogs(100, id)
      
      const metadata = {
        id: document.id,
        filename: document.filename,
        status: document.status,
        hashes: {
          original_gost: document.original_hash,
          encrypted_gost: document.encrypted_hash,
        },
        signature: {
          data: document.signature,
          algorithm: "GOST_34.10-2018",
          signed_at: document.updated_at,
        },
        encryption: {
          algorithm: document.encryption_algorithm,
          is_encrypted: !!document.encryption_algorithm,
        },
        file_info: {
          mime_type: document.mime_type,
          size_bytes: document.file_size,
          created_at: document.created_at,
          uploader: document.uploader_name || document.uploader_username,
        },
        audit_trail: history
      }

      // Log the download action
      await logAudit("DOWNLOAD_METADATA", user.id, id, {
        filename: document.filename
      })

      return new NextResponse(JSON.stringify(metadata, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${document.filename}.metadata.json"`,
        },
      })
    }

    // ---------------------------------------------------------
    // Mode: File Download
    // ---------------------------------------------------------
    
    if (!document.encrypted_data) {
      return NextResponse.json({ error: "File data not found" }, { status: 404 })
    }

    let fileBuffer: Buffer
    let downloadFilename = document.filename
    let contentType = document.mime_type || "application/octet-stream"

    // Logic to handle different states
    if (document.status === "encrypted" || document.status === "verified") {
      // If encrypted, we download the encrypted container (JSON string in this demo implementation)
      // or the raw encrypted bytes if it was binary. 
      // In this system's "encrypt" route, it saves JSON.stringify(encryptedResult).
      fileBuffer = Buffer.from(document.encrypted_data)
      downloadFilename = `${document.filename}.enc.json`
      contentType = "application/json"
    } else {
      // Draft or Signed: encrypted_data holds the base64 of the original file
      fileBuffer = Buffer.from(document.encrypted_data, "base64")
    }

    // Log the download action
    await logAudit("DOWNLOAD_FILE", user.id, id, {
      filename: downloadFilename,
      mode: "original",
      status: document.status
    })

    // Cast fileBuffer to any to satisfy TypeScript BodyInit requirement
    // Node.js Buffer is compatible at runtime
    return new NextResponse(fileBuffer as any, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${downloadFilename}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error("[v0] Download error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}