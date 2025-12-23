"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, Lock, CheckCircle, FileSignature, Shield, Trash2, 
  Download, FileIcon, FileJson, AlertTriangle, XCircle 
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"
import { WorkflowDiagram } from "@/components/workflow-diagram"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Document {
  id: string
  filename: string
  status: "draft" | "signed" | "encrypted" | "verified" | "tampered" // Added 'tampered' locally
  original_hash: string
  uploader_username: string
  uploader_name: string
  created_at: string
}

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [processingDoc, setProcessingDoc] = useState<string | null>(null)
  
  // Состояние для отображения ошибок верификации
  const [verifyError, setVerifyError] = useState<{id: string, message: string} | null>(null)

  async function loadDocuments() {
    try {
      const response = await fetch("/api/documents")
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (err) {
      console.error("Failed to load documents:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  async function handleSign(documentId: string) {
    setActionLoading(documentId)
    setProcessingDoc(documentId)
    try {
      const response = await fetch(`/api/documents/${documentId}/sign`, {
        method: "POST",
      })
      if (response.ok) await loadDocuments()
    } catch (err) {
      console.error("Failed to sign:", err)
    } finally {
      setActionLoading(null)
      setTimeout(() => setProcessingDoc(null), 1000)
    }
  }

  async function handleEncrypt(documentId: string) {
    setActionLoading(documentId)
    setProcessingDoc(documentId)
    try {
      const response = await fetch(`/api/documents/${documentId}/encrypt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ algorithm: "MGM" }),
      })
      if (response.ok) await loadDocuments()
    } catch (err) {
      console.error("Failed to encrypt:", err)
    } finally {
      setActionLoading(null)
      setTimeout(() => setProcessingDoc(null), 1000)
    }
  }

  async function handleVerify(documentId: string) {
    setActionLoading(documentId)
    setProcessingDoc(documentId)
    setVerifyError(null)
    
    try {
      const response = await fetch(`/api/documents/${documentId}/verify`, {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        await loadDocuments()
      } else {
        // Если проверка не прошла
        setVerifyError({
          id: documentId,
          message: data.message || "Ошибка проверки"
        })
        
        // Если обнаружена подмена файла, помечаем его локально как 'tampered'
        if (data.reason === 'tampered') {
          setDocuments(docs => docs.map(d => d.id === documentId ? {...d, status: 'tampered'} : d))
        }
      }
    } catch (err) {
      console.error("Failed to verify:", err)
    } finally {
      setActionLoading(null)
      setTimeout(() => setProcessingDoc(null), 1000)
    }
  }

  async function handleDelete(documentId: string) {
    setActionLoading(documentId)
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      })
      if (response.ok) await loadDocuments()
    } catch (err) {
      console.error("Failed to delete:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownload = (documentId: string, filename: string, mode: 'file' | 'metadata' = 'file') => {
    const url = `/api/documents/${documentId}/download?mode=${mode}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', mode === 'file' ? filename : `${filename}.metadata.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  function getStatusBadge(status: string) {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: any }> = {
      draft: { label: "Черновик", variant: "secondary", icon: FileText },
      signed: { label: "Подписан", variant: "default", icon: FileSignature },
      encrypted: { label: "Зашифрован", variant: "outline", icon: Lock },
      verified: { label: "Проверен", variant: "default", icon: CheckCircle },
      tampered: { label: "НАРУШЕНА ЦЕЛОСТНОСТЬ", variant: "destructive", icon: AlertTriangle },
    }

    const config = variants[status] || variants.draft
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={cn("flex items-center gap-1", status === 'tampered' && "animate-pulse font-bold")}>
        <Icon className="h-4 w-4" />
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return <div className="text-center py-8">Загрузка документов...</div>
  }

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <div key={doc.id} className="space-y-4">
          {processingDoc === doc.id && doc.status !== 'tampered' && <WorkflowDiagram currentStatus={doc.status as any} />}

          <Card className={cn(
            doc.status === 'tampered' && "border-destructive/50 bg-destructive/5 dark:bg-destructive/10"
          )}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {doc.status === 'tampered' ? <XCircle className="h-5 w-5 text-destructive" /> : <FileText className="h-5 w-5" />}
                    {doc.filename}
                  </CardTitle>
                  <CardDescription>
                    Загружен: {doc.uploader_name || doc.uploader_username} •{" "}
                    {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: ru })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(doc.status)}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload(doc.id, doc.filename, 'file')}>
                        <FileIcon className="mr-2 h-4 w-4" />
                        Скачать файл
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(doc.id, doc.filename, 'metadata')}>
                        <FileJson className="mr-2 h-4 w-4" />
                        Скачать метаданные (JSON)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={actionLoading === doc.id}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Удалить документ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Вы уверены, что хотите удалить документ "{doc.filename}"? Это действие нельзя отменить.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(doc.id)}
                          className="bg-destructive text-destructive-foreground"
                        >
                          Удалить
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {verifyError && verifyError.id === doc.id && (
                <div className="mb-4 p-3 bg-destructive/15 text-destructive rounded-md flex items-center gap-2 text-sm border border-destructive/20">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-semibold">{verifyError.message}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">Хэш ГОСТ 34.11 (Стрибог-512):</span>
                  <code className={cn(
                    "block mt-1 text-xs p-2 rounded font-mono break-all",
                    doc.status === 'tampered' ? "bg-destructive/10 text-destructive" : "bg-muted"
                  )}>
                    {doc.original_hash}
                  </code>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {doc.status === "draft" && (
                    <Button size="sm" onClick={() => handleSign(doc.id)} disabled={actionLoading === doc.id}>
                      <FileSignature className="mr-2 h-4 w-4" />
                      Подписать (ГОСТ 34.10)
                    </Button>
                  )}

                  {doc.status === "signed" && (
                    <Button size="sm" onClick={() => handleEncrypt(doc.id)} disabled={actionLoading === doc.id}>
                      <Lock className="mr-2 h-4 w-4" />
                      Зашифровать (Кузнечик)
                    </Button>
                  )}

                  {(doc.status === "encrypted" || doc.status === "tampered" || doc.status === "signed") && (
                    <Button 
                      size="sm" 
                      onClick={() => handleVerify(doc.id)} 
                      disabled={actionLoading === doc.id}
                      variant={doc.status === 'tampered' ? "destructive" : "default"}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      {doc.status === 'tampered' ? "Перепроверить целостность" : "Проверить подпись"}
                    </Button>
                  )}

                  {doc.status === "verified" && (
                    <Badge variant="default" className="px-3 py-1 bg-green-600 hover:bg-green-700">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Документ защищен
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}

      {documents.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Документы отсутствуют. Загрузите первый документ.
          </CardContent>
        </Card>
      )}
    </div>
  )
}