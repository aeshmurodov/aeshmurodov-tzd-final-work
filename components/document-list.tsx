"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, Lock, CheckCircle, FileSignature, Shield, Trash2, 
  Download, FileIcon, FileJson, AlertTriangle, XCircle,
  Play, Gavel, Archive, FileX
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface Document {
  id: string
  filename: string
  status: string
  original_hash: string
  uploader_username: string
  uploader_name: string
  created_at: string
  act_number?: string
  act_date?: string
}

interface UserProfile {
  id: string
  role: "admin" | "manager" | "user"
}

export function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null) // Храним инфо о пользователе
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [processingDoc, setProcessingDoc] = useState<string | null>(null)
  
  const [actDialogOpen, setActDialogOpen] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [actType, setActType] = useState<"declassify" | "destroy" | null>(null)
  const [actNumber, setActNumber] = useState("")

  // Состояние для отображения ошибок верификации
  const [verifyError, setVerifyError] = useState<{id: string, message: string} | null>(null)


  useEffect(() => {
    async function init() {
      try {
        // 1. Загружаем документы
        const docsRes = await fetch("/api/documents")
        const docsData = await docsRes.json()
        setDocuments(docsData.documents || [])

        // 2. Загружаем текущего пользователя для проверки прав
        const userRes = await fetch("/api/auth/me")
        if (userRes.ok) {
           const userData = await userRes.json()
           setCurrentUser(userData.user)
        }
      } catch (err) {
        console.error("Initialization error:", err)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const submitAct = async () => {
    if (!selectedDocId || !actType || !actNumber) return
    
    await handleLifecycle(selectedDocId, actType, { 
      number: actNumber, 
      date: new Date().toISOString() 
    })
    
    setActDialogOpen(false)
    setSelectedDocId(null)
    setActType(null)
  }

  const openActDialog = (id: string, type: "declassify" | "destroy") => {
    setSelectedDocId(id)
    setActType(type)
    setActNumber("")
    setActDialogOpen(true)
  }

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

  async function handleLifecycle(id: string, action: string, details?: any) {
    setActionLoading(id)
    setProcessingDoc(id)
    try {
      const response = await fetch(`/api/documents/${id}/lifecycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, actDetails: details }),
      })
      if (!response.ok) {
         const err = await response.json()
         alert(err.error || "Ошибка") // Простой алерт для демонстрации отказа в доступе
         return
      }
      // Перезагрузка списка
      const docsRes = await fetch("/api/documents")
      const docsData = await docsRes.json()
      setDocuments(docsData.documents || [])
    } catch (err) {
      console.error("Lifecycle error:", err)
    } finally {
      setActionLoading(null)
      setTimeout(() => setProcessingDoc(null), 1000)
    }
  }

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

  // Вспомогательная функция проверки прав для UI
  const canApprove = currentUser?.role === 'manager' || currentUser?.role === 'admin'
  const canToPdek = currentUser?.role === 'manager' || currentUser?.role === 'admin'
  const canFinalize = currentUser?.role === 'admin'


  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      draft: { label: "Черновик", variant: "secondary", icon: FileText },
      signed: { label: "Подписан", variant: "secondary", icon: FileSignature },
      encrypted: { label: "Зашифрован", variant: "outline", icon: Lock },
      verified: { label: "Проверен", variant: "default", icon: CheckCircle },
      execution: { label: "На исполнении", variant: "default", icon: Play },
      pdek_review: { label: "На ПДЭК", variant: "destructive", icon: Gavel },
      declassified: { label: "Рассекречен", variant: "outline", icon: Archive },
      destroyed: { label: "Уничтожен", variant: "destructive", icon: FileX },
      tampered: { label: "НАРУШЕНА ЦЕЛОСТНОСТЬ", variant: "destructive", icon: AlertTriangle },
    }
    const config = variants[status] || variants.draft
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className={cn("flex items-center gap-1", status === 'tampered' && "animate-pulse")}>
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
          {processingDoc === doc.id && doc.status !== 'tampered' && <WorkflowDiagram currentStatus={doc.status} />}

          <Card className={cn(doc.status === 'destroyed' && "opacity-75 bg-muted/50")}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {doc.status === 'destroyed' ? <FileX className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                    {doc.filename}
                  </CardTitle>
                  <CardDescription>
                    {doc.uploader_name} • {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: ru })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                   {getStatusBadge(doc.status)}
                   {/* Кнопки скачивания (оставляем всем) */}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {/* 1. РОЛЬ USER (и все остальные): Подготовка */}
                {doc.status === "draft" && (
                  <Button size="sm" onClick={() => handleSign(doc.id)}>Подписать</Button>
                )}
                {doc.status === "signed" && (
                   <Button size="sm" onClick={() => handleEncrypt(doc.id)}>Зашифровать</Button>
                )}
                
                {/* 2. РОЛЬ MANAGER: Утверждение */}
                {(doc.status === "encrypted" || doc.status === "verified") && (
                   canApprove ? (
                     <Button size="sm" onClick={() => handleLifecycle(doc.id, "approve")}>
                       <Play className="mr-2 h-4 w-4" /> На исполнение
                     </Button>
                   ) : (
                     <Badge variant="outline" className="text-muted-foreground">Ожидает утверждения менеджером</Badge>
                   )
                )}

                {/* 3. РОЛЬ MANAGER: Передача на ПДЭК */}
                {doc.status === "execution" && (
                   canToPdek ? (
                     <Button size="sm" variant="secondary" onClick={() => handleLifecycle(doc.id, "to_pdek")}>
                       <Gavel className="mr-2 h-4 w-4" /> Передать на ПДЭК
                     </Button>
                   ) : (
                     <Badge variant="outline" className="text-muted-foreground">На исполнении</Badge>
                   )
                )}

                {/* 4. РОЛЬ ADMIN: Финал */}
                {doc.status === "pdek_review" && (
                  canFinalize ? (
                    <>
                      <Button size="sm" variant="outline" className="border-green-500 text-green-600 hover:bg-green-50" onClick={() => openActDialog(doc.id, "declassify")}>
                        <Archive className="mr-2 h-4 w-4" /> Рассекретить
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => openActDialog(doc.id, "destroy")}>
                        <FileX className="mr-2 h-4 w-4" /> Уничтожить
                      </Button>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-destructive">На рассмотрении комиссии (Требуется Админ)</Badge>
                  )
                )}
                
                {/* Финал */}
                {doc.status === "destroyed" && (
                  <div className="text-sm text-muted-foreground italic">
                    Документ уничтожен.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
      {/* Диалог ввода номера акта */}
      <AlertDialog open={actDialogOpen} onOpenChange={setActDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actType === 'declassify' ? 'Рассекречивание документа' : 'Уничтожение документа'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actType === 'declassify' 
                ? 'Введите номер приказа/акта о передаче в открытое делопроизводство.' 
                : 'Введите номер акта об уничтожении. Файл будет удален безвозвратно, останется только карточка (лист-заместитель).'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="act_number">Номер акта/приказа</Label>
            <Input 
              id="act_number" 
              value={actNumber} 
              onChange={(e) => setActNumber(e.target.value)} 
              placeholder="№ 123-ОД от ..." 
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={submitAct} disabled={!actNumber}>Подтвердить</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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