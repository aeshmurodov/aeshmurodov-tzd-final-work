"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Users, Shield, Activity } from "lucide-react"

interface Stats {
  documents: {
    total: number
    byStatus: Record<string, number>
  }
  users: {
    total: number
  }
  audit: {
    total: number
    today: number
  }
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch("/api/stats")
        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error("[log] Failed to load stats:", err)
      }
    }

    loadStats()
    const interval = setInterval(loadStats, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  if (!stats) {
    return <div>Загрузка статистики...</div>
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Всего документов</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.documents?.total}</div>
          <p className="text-xs text-muted-foreground">Защищено: {stats.documents?.byStatus?.verified || 0}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Подписано</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(stats.documents?.byStatus?.signed || 0) +
              (stats.documents?.byStatus?.encrypted || 0) +
              (stats.documents?.byStatus?.verified || 0)}
          </div>
          <p className="text-xs text-muted-foreground">ГОСТ 34.10-2018</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Пользователей</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.users?.total}</div>
          <p className="text-xs text-muted-foreground">Активных в системе</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Аудит сегодня</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.audit?.today}</div>
          <p className="text-xs text-muted-foreground">Всего: {stats.audit?.total}</p>
        </CardContent>
      </Card>
    </div>
  )
}
