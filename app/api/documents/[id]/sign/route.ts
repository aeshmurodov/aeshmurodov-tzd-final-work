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

    // Get document
    const docResult = await sql`
      SELECT * FROM documents WHERE id = ${id} LIMIT 1
    `

    if (docResult.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const document = docResult[0]

    // Check if user has a key pair
    const keyResult = await sql`
      SELECT * FROM encryption_keys WHERE user_id = ${user.id} LIMIT 1
    `

    let privateKey: string
    let publicKey: string

    if (keyResult.length === 0) {
      // Generate new key pair
      const keyPair = GOSTCrypto.generateKeyPair()
      privateKey = keyPair.privateKey
      publicKey = keyPair.publicKey

      // Store keys
      await sql`
        INSERT INTO encryption_keys (user_id, public_key, private_key_encrypted, algorithm)
        VALUES (${user.id}, ${publicKey}, ${privateKey}, 'GOST_34.10-2018')
      `
    } else {
      privateKey = keyResult[0].private_key_encrypted
      publicKey = keyResult[0].public_key
    }

    // Sign document hash
    const signature = GOSTCrypto.sign(document.original_hash, privateKey)

    // Update document
    await sql`
      UPDATE documents
      SET 
        signature = ${signature},
        status = 'signed',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    await logAudit("DOCUMENT_SIGN", user.id, id, {
      signature: signature.substring(0, 32) + "...",
      algorithm: "GOST_34.10-2018",
    })

    return NextResponse.json({
      success: true,
      signature,
      publicKey,
    })
  } catch (error) {
    console.error("[log] Sign document error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
