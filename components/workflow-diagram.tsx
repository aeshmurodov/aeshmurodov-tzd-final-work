"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FileSignature, Play, Clock, Gavel, Archive, Trash2, ChevronDown, ChevronUp, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface WorkflowDiagramProps {
  currentStatus?: string
}

export function WorkflowDiagram({ currentStatus }: WorkflowDiagramProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // Определяем активный этап на основе статуса
  const getStageIndex = (status?: string) => {
    if (!status) return 0
    if (status === 'draft' || status === 'review') return 0
    if (status === 'approved' || status === 'signed' || status === 'encrypted' || status === 'verified') return 1
    if (status === 'execution') return 2
    if (status === 'pdek_review') return 3
    if (status === 'declassified' || status === 'destroyed') return 4
    return 0
  }

  const activeIndex = getStageIndex(currentStatus)

  const stages = [
    {
      icon: FileText,
      label: "Создание",
      description: "Регистрация, черновик",
    },
    {
      icon: FileSignature,
      label: "Утверждение",
      description: "Согласование и подпись",
    },
    {
      icon: Play,
      label: "Исполнение",
      description: "Работа с документом",
    },
    {
      icon: Clock,
      label: "Хранение (4 года)",
      description: "Ожидание ПДЭК",
    },
    {
      icon: Gavel,
      label: "ПДЭК",
      description: "Экспертная комиссия",
    },
  ]

  // Финальные ветки
  const isDeclassified = currentStatus === 'declassified'
  const isDestroyed = currentStatus === 'destroyed'

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Жизненный цикл документа</CardTitle>
            <CardDescription>Схема движения согласно регламенту ПДЭК</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="flex flex-col gap-6">
            {/* Основной поток */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 relative">
              {stages.map((stage, index) => {
                const isActive = activeIndex === index
                const isPast = activeIndex > index

                return (
                  <div key={index} className="flex items-center gap-2 w-full md:w-auto z-10">
                    <div className="flex flex-col items-center gap-2 flex-1 min-w-[100px]">
                      <div
                        className={cn(
                          "rounded-full border-2 p-3 transition-all duration-300 bg-background",
                          isActive && "border-primary text-primary shadow-lg scale-110",
                          isPast && "border-primary/50 text-primary/50",
                          !isActive && !isPast && "border-muted text-muted-foreground",
                        )}
                      >
                        <stage.icon className="h-5 w-5" />
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-xs md:text-sm">{stage.label}</div>
                        <div className="text-[10px] text-muted-foreground hidden md:block">{stage.description}</div>
                      </div>
                    </div>
                    {index < stages.length - 1 && (
                      <div className={cn("h-0.5 flex-1 bg-border hidden md:block", isPast && "bg-primary/50")} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Ветвление финала */}
            {(activeIndex >= 4) && (
              <div className="flex justify-center gap-8 mt-4 pt-4 border-t border-dashed">
                <div className={cn("flex flex-col items-center gap-2 p-4 rounded-lg border", isDeclassified ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "opacity-50")}>
                  <Archive className={cn("h-6 w-6", isDeclassified ? "text-green-600" : "text-muted-foreground")} />
                  <div className="text-center">
                    <div className="font-bold text-sm">Рассекречено</div>
                    <div className="text-xs">Передача в открытое<br/>делопроизводство</div>
                  </div>
                </div>

                <div className={cn("flex flex-col items-center gap-2 p-4 rounded-lg border", isDestroyed ? "border-destructive bg-destructive/10" : "opacity-50")}>
                  <Trash2 className={cn("h-6 w-6", isDestroyed ? "text-destructive" : "text-muted-foreground")} />
                  <div className="text-center">
                    <div className="font-bold text-sm">Уничтожено</div>
                    <div className="text-xs">Акт об уничтожении<br/>Лист-заместитель</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}