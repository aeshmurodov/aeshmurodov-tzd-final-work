"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, FileText } from "lucide-react"

interface DocumentUploadProps {
  onUploadComplete?: () => void
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()

    if (!file) {
      setMessage("Выберите файл")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const fileData = event.target?.result as string

        const response = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: file.name,
            fileData: fileData.split(",")[1], // Remove data:mime;base64, prefix
            mimeType: file.type,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          setMessage(data.error || "Ошибка загрузки")
          setLoading(false)
          return
        }

        setMessage("Документ успешно загружен")
        setFile(null)
        setLoading(false)

        if (onUploadComplete) {
          onUploadComplete()
        }
      }

      reader.readAsDataURL(file)
    } catch (err) {
      setMessage("Ошибка загрузки файла")
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Загрузить документ</CardTitle>
        <CardDescription>Выберите файл для добавления в систему защищенного документооборота</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Файл</Label>
            <div className="flex items-center gap-2">
              <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} disabled={loading} />
              {file && <FileText className="h-5 w-5 text-muted-foreground" />}
            </div>
          </div>
          {message && (
            <div className={`text-sm ${message.includes("успешно") ? "text-green-600" : "text-destructive"}`}>
              {message}
            </div>
          )}
          <Button type="submit" disabled={loading || !file}>
            <Upload className="mr-2 h-4 w-4" />
            {loading ? "Загрузка..." : "Загрузить"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
