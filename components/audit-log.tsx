"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { ru } from "date-fns/locale"

interface AuditLogEntry {
  id: string
  action: string
  username?: string
  full_name?: string
  details?: Record<string, any>
  timestamp: string
}

export function AuditLog() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadLogs() {
      try {
        const response = await fetch("/api/audit")
        if (response.ok) {
          const data = await response.json()
          setLogs(data.logs || [])
        }
      } catch (err) {
        console.error("[log] Failed to load audit logs:", err)
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [])

  function getActionLabel(action: string): string {
    const labels: Record<string, string> = {
      LOGIN_SUCCESS: "Вход в систему",
      LOGIN_FAILED: "Неудачная попытка входа",
      LOGOUT: "Выход из системы",
      DOCUMENT_UPLOAD: "Загрузка документа",
      DOCUMENT_SIGN: "Подписание документа",
      DOCUMENT_ENCRYPT: "Шифрование документа",
      DOCUMENT_VERIFY: "Проверка подписи",
      SYSTEM_INIT: "Инициализация системы",
    }
    return labels[action] || action
  }

  function getActionVariant(action: string): "default" | "secondary" | "outline" | "destructive" {
    if (action.includes("FAILED")) return "destructive"
    if (action.includes("SUCCESS") || action.includes("VERIFY")) return "default"
    return "secondary"
  }

  if (loading) {
    return <div>Загрузка журнала аудита...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Журнал аудита</CardTitle>
        <CardDescription>Полная история действий в системе для соответствия требованиям безопасности</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between border-b pb-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={getActionVariant(log.action)}>{getActionLabel(log.action)}</Badge>
                    {log.username && (
                      <span className="text-sm text-muted-foreground">{log.full_name || log.username}</span>
                    )}
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="text-xs text-muted-foreground">{JSON.stringify(log.details)}</div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: ru })}
                </div>
              </div>
            ))}
            {logs.length === 0 && <div className="text-center text-muted-foreground py-8">Записи отсутствуют</div>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
