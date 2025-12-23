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
      SELECT d.*, k.public_key
      FROM documents d
      JOIN encryption_keys k ON d.uploader_id = k.user_id
      WHERE d.id = ${id}
      LIMIT 1
    `

    if (docResult.length === 0) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    const document = docResult[0]

    // --- STEP 1: INTEGRITY CHECK (PHYSICAL TAMPERING) ---
    // Проверяем, совпадает ли хэш текущих данных с записанным в БД original_hash
    if (document.status === 'signed' || document.status === 'draft') {
       // В этих статусах encrypted_data хранит base64 самого файла
       const currentBuffer = Buffer.from(document.encrypted_data, 'base64')
       const currentHash = GOSTCrypto.streebog512(currentBuffer)

       if (currentHash !== document.original_hash) {
         await logAudit("INTEGRITY_CHECK_FAILED", user.id, id, {
           expected: document.original_hash,
           actual: currentHash
         })
         
         return NextResponse.json({
           valid: false,
           reason: "tampered",
           message: "КРИТИЧЕСКАЯ ОШИБКА: Файл был изменен! Хэш-сумма не совпадает с оригинальной."
         })
       }
    }

    // --- STEP 2: SIGNATURE VERIFICATION (AUTHORSHIP) ---
    if (!document.signature) {
      return NextResponse.json({ error: "Document not signed" }, { status: 400 })
    }

    // Verify signature
    const isValid = GOSTCrypto.verify(document.original_hash, document.signature, document.public_key)

    if (isValid) {
      // Update document status
      await sql`
        UPDATE documents
        SET status = 'verified', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `
    }

    await logAudit("DOCUMENT_VERIFY", user.id, id, {
      result: isValid ? "success" : "failed",
    })

    return NextResponse.json({
      valid: isValid,
      reason: isValid ? "success" : "invalid_signature",
      message: isValid 
        ? "Подпись и целостность подтверждены успешно" 
        : "Ошибка проверки цифровой подписи"
    })
  } catch (error) {
    console.error("[log] Verify document error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}