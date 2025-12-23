import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getSession } from "@/lib/session"
import { GOSTCrypto } from "@/lib/crypto"
import { logAudit } from "@/lib/audit"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const { algorithm = "MGM" } = await request.json()

    // Get document
    const docResult = await sql`
      SELECT * FROM documents WHERE id = ${id} LIMIT 1
    `

    if (docResult.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const document = docResult[0]

    if (!document.encrypted_data) {
      return NextResponse.json({ error: "No data to encrypt" }, { status: 400 })
    }

    // Generate encryption key
    const key = GOSTCrypto.generateKey(32)
    const dataBuffer = Buffer.from(document.encrypted_data, "base64")

    let encryptedResult
    let encryptionAlgorithm

    if (algorithm === "MGM") {
      // Authenticated encryption
      encryptedResult = GOSTCrypto.mgmEncrypt(dataBuffer, key, `document:${id}:user:${user.id}`)
      encryptionAlgorithm = "GOST_34.13_MGM"
    } else {
      // Kuznyechik encryption
      encryptedResult = GOSTCrypto.kuznyechikEncrypt(dataBuffer, key)
      encryptionAlgorithm = "GOST_34.12_Kuznyechik"
    }

    // Calculate encrypted hash
    const encryptedHash = GOSTCrypto.streebog512(encryptedResult.ciphertext)

    // Update document
    await sql`
      UPDATE documents
      SET 
        encrypted_hash = ${encryptedHash},
        status = 'encrypted',
        encryption_algorithm = ${encryptionAlgorithm},
        encrypted_data = ${JSON.stringify(encryptedResult)},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    await logAudit("DOCUMENT_ENCRYPT", user.id, id, {
      algorithm: encryptionAlgorithm,
      hash: encryptedHash,
    })

    return NextResponse.json({
      success: true,
      encryptedHash,
      algorithm: encryptionAlgorithm,
    })
  } catch (error) {
    console.error("[log] Encrypt document error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
